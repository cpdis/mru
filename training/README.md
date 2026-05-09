# Training data drop zone

Where to put the raw exports for the "training behind the runs" section.
The preprocessor will read from here and write tidy JSON to
`site/public/data/training.json`.

## strava/

Drop the Strava bulk export here. Specifically we need
`activities.csv` from the export ZIP. Per‑activity FIT files are
optional — the summary CSV has everything the headline analyses need
(date, type, distance, duration, elevation, HR, pace).

How to get it:
1. https://www.strava.com/account → "Download or Delete Your Account"
2. "Request your archive" (NOT the delete option!)
3. Wait 24 hours for the email with a ZIP attachment
4. Unzip somewhere, copy `activities.csv` into `training/strava/`

## trainingpeaks/

Drop the TrainingPeaks export here. Format flexible — CSV, XLS, or
multiple per‑week exports all work.

The metrics that would actually unlock interesting analysis (and that
Strava doesn't have) are TSS, IF, CTL, ATL. If your export has them,
the fitness‑curve story becomes possible.

How to export depends on your TP account level. If you're not sure,
just upload whatever you can grab and the preprocessor will adapt.
