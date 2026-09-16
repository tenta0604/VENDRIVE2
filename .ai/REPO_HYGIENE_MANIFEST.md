# Active workflow manifest

After this cleanup, the intended reusable workflow set is:

- `create-safety-tag.yml` — immutable pre-change checkpoints.
- `an15-hardening-tests.yml` — executable intelligence hardening tests.
- `maintenance-executor.yml` — generic guarded maintenance executor, retained for separate review.

All completed OPS10A one-off workflows and `ops10b2-exec.yml` are retired. The cleanup does not alter application runtime files.
