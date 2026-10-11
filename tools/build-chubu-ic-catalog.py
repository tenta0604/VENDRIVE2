#!/usr/bin/env python3
"""Build the small, audited VENDRIVE motorway ramp catalog from an offline OSM PBF.
Run in GitHub Actions, NOT on a user's route request. Needs: pip install osmium.
Source: https://download.geofabrik.de/asia/japan/chubu.html (ODbL).
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path

# Western Aichi pilot: Ichinomiya, Nagoya, Tobishima and their motorway corridors.
BOUNDS = [34.83, 136.42, 35.56, 137.28]  # south, west, north, east
DENIED = {"no", "private", "restricted", "agricultural", "forestry"}


def movement(refs, reverse=False):
    """(node id, permitted approach, permitted departure) on a directed way."""
    ids = refs[::-1] if reverse else refs
    for i, nodeid in enumerate(ids):
        yield nodeid, i > 0, i + 1 < len(ids)


def legal(tags):
    return not any(tags.get(k, "").lower() in DENIED
                   for k in ("access", "vehicle", "motor_vehicle", "hgv"))


def candidate_flags(ways, positions):
    """Proof of an entry/exit uses *shared motorway and motorway_link nodes*
    plus compatible forward direction on BOTH connected road classes.
    motorway_junction nodes alone are exit labels and cannot prove entries.
    """
    flags = {}  # bits: motorway-in=1, motorway-out=2, link-in=4, link-out=8
    for roadtype, ids, tags in ways:
        if not legal(tags):
            continue
        oneway = tags.get("oneway", "").strip().lower()
        if oneway in ("no", "0", "false", "reversible", "alternating"):
            continue  # ambiguous/access directions never become a waypoint
        if oneway not in ("", "yes", "1", "true", "-1"):
            continue
        reverse = oneway == "-1"
        for nid, arriving, departing in movement(ids, reverse):
            if nid not in positions:
                continue
            value = flags.get(nid, 0)
            if roadtype == "motorway":
                if arriving:
                    value |= 1
                if departing:
                    value |= 2
            else:
                if arriving:
                    value |= 4
                if departing:
                    value |= 8
            flags[nid] = value
    entries, exits = [], []
    for nid, flags_at in flags.items():
        lat, lng = positions[nid]
        item = {"id": nid, "lat": round(lat, 7), "lng": round(lng, 7),
                "ref": "", "name": ""}
        if (flags_at & 2) and (flags_at & 4):
            entries.append(dict(item, role="entry"))
        if (flags_at & 1) and (flags_at & 8):
            exits.append(dict(item, role="exit"))
    entries.sort(key=lambda v: v["id"])
    exits.sort(key=lambda v: v["id"])
    return entries, exits


def build(pbf_path, source_url, source_date):
    import osmium
    class WayCollector(osmium.SimpleHandler):
        def __init__(self):
            super().__init__()
            self.ways = []
            self.wanted = set()
        def way(self, w):
            kind = w.tags.get("highway")
            if kind not in ("motorway", "motorway_link"):
                return
            refs = [n.ref for n in w.nodes]
            if len(refs) < 2:
                return
            tags = {k: w.tags.get(k) or "" for k in
                    ("oneway", "access", "vehicle", "motor_vehicle", "hgv")}
            self.ways.append((kind, refs, tags))
            self.wanted.update(refs)
    ways = WayCollector()
    ways.apply_file(str(pbf_path))
    class NodeCollector(osmium.SimpleHandler):
        def __init__(self, wanted):
            super().__init__()
            self.wanted = wanted
            self.positions = {}
        def node(self, n):
            if n.id not in self.wanted or not n.location.valid():
                return
            lat, lng = n.location.lat, n.location.lon
            south, west, north, east = BOUNDS
            if south <= lat <= north and west <= lng <= east:
                self.positions[n.id] = (lat, lng)
    nodes = NodeCollector(ways.wanted)
    nodes.apply_file(str(pbf_path))
    entries, exits = candidate_flags(ways.ways, nodes.positions)
    if len(entries) < 15 or len(exits) < 15:
        raise RuntimeError("Refusing to publish thin/no motorway ramps: entries="
                           + str(len(entries)) + " exits=" + str(len(exits)))
    h = hashlib.sha256()
    with pbf_path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    data = {
        "schemaVersion": 1,
        "source": {
            "provider": "Geofabrik",
            "region": "Chubu Japan",
            "url": source_url,
            "pbfSha256": h.hexdigest(),
            "sourceDate": source_date,
            "license": "OpenStreetMap contributors, ODbL 1.0"
        },
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "bounds": BOUNDS,
        "entryCount": len(entries),
        "exitCount": len(exits),
        "candidates": entries + exits,
        "method": "shared directed motorway/motorway_link nodes, explicit/access-gated"
    }
    return data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pbf", type=Path)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--source-date", required=True)
    parser.add_argument("--output", type=Path, default=Path("api/chubu-ic-catalog.mjs"))
    parser.add_argument("--metadata", type=Path, default=Path("data/chubu-ic-catalog-meta.json"))
    args = parser.parse_args()
    data = build(args.pbf, args.source_url, args.source_date)
    # JavaScript ESM supports Vercel's Node runtime without fs, JSON assertions or a CDN.
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("// Generated from OSM/Geofabrik. Do not edit by hand.\n"
        + "export const CHUBU_IC_CATALOG = Object.freeze("
        + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ");\n", encoding="utf-8")
    args.metadata.parent.mkdir(parents=True, exist_ok=True)
    meta = {k: v for k, v in data.items() if k != "candidates"}
    args.metadata.write_text(json.dumps(meta, indent=2, ensure_ascii=False)
                             + "\n", encoding="utf-8")
    print("CATALOG_PASS entries={} exits={} bytes={} sha256={}".format(
        data["entryCount"], data["exitCount"], args.output.stat().st_size,
        data["source"]["pbfSha256"]))


if __name__ == "__main__":
    main()
