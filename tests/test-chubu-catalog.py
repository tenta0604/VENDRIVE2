"""Synthetic directional safety checks, no live OSM or ORS traffic."""
import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / "tools" / "build-chubu-ic-catalog.py"
spec = importlib.util.spec_from_file_location("ic_generator", path)
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class CatalogDirections(unittest.TestCase):
    def test_entry_and_exit_are_not_interchangeable(self):
        nodes = {
            1: (35.0, 136.7), 2: (35.01, 136.71), 3: (35.02, 136.72),
            4: (35.03, 136.73), 8: (35.01, 136.70), 9: (35.02, 136.73)}
        ways = [
            ("motorway", [1, 2, 3, 4], {"oneway": "yes"}),
            ("motorway_link", [8, 2], {"oneway": "yes"}),
            ("motorway_link", [3, 9], {"oneway": "yes"})
        ]
        entries, exits = generator.candidate_flags(ways, nodes)
        self.assertEqual([n["id"] for n in entries], [2])
        self.assertEqual([n["id"] for n in exits], [3])

    def test_reverse_oneway_and_hgv_restrictions(self):
        nodes = {a: (35.1, 136.8 + a / 1000) for a in (1, 2, 3, 8, 9)}
        ways = [
            ("motorway", [1, 2, 3], {"oneway": "-1"}),
            ("motorway_link", [2, 8], {"oneway": "-1"}),
            ("motorway_link", [9, 3], {"oneway": "-1", "hgv": "no"}),
            ("motorway_link", [1, 9], {"oneway": "no"})
        ]
        entries, exits = generator.candidate_flags(ways, nodes)
        self.assertEqual([n["id"] for n in entries], [2])
        self.assertEqual(len(exits), 0)

    def test_no_roads_no_invented_points(self):
        a, b = generator.candidate_flags([], {1: (35.3, 136.8)})
        self.assertEqual((a, b), ([], []))


if __name__ == "__main__":
    unittest.main()
