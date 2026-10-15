# SHA Toolkit

Get ready for your **Separation Health Assessment (SHA 2025 Part A)** and VA disability claim with Claude.

Claude removes your personal information from your medical records, reads them, asks you the SHA questions one at a time (Yes / No / Explain), and builds an Excel tracker of your likely conditions, VA diagnostic codes, and estimated combined rating — plus a sheet of your SHA answers to copy onto the real form.

## How to start

What you need: a computer, your MHS GENESIS Patient Portal login, and a paid Claude account.

1. Install the Claude desktop app: https://claude.ai/download — sign in.
2. Download this kit: green **Code** button → **Download ZIP**. Unzip it somewhere easy to find, like your Desktop.
3. Open Claude, click **Code**, and choose the unzipped folder.
4. Type: `start`

Claude takes it from there. It asks before installing anything — click **Approve** when it does. Stop any time; type `resume` later to pick up where you left off, or `update` after adding new records.

## Your privacy

- Claude never opens your original records. Scripts on your own computer strip names, SSN, DoD ID, birth date, phone numbers, emails, and addresses first, then check the result before Claude reads anything.
- Your SSN, DoD ID, and birth date go into `private-ids.txt`, a file you fill in yourself in Notepad. Only the cleanup scripts read it — never the chat.
- Your records, settings, and tracker stay on your computer. `.gitignore` keeps them out of any repository.

## What you get

`SHA Tracker.xlsx` with three sheets:

1. **Medical** — your conditions grouped by how ready they are to file, with diagnostic code, estimated %, evidence, and a running combined rating (38 CFR 4.25, with the 4.26 bilateral factor).
2. **Potential Conditions** — possible claims worth looking into.
3. **SHA Answers** — your answers, with the record that supports each one.

## Not legal or medical advice

This is a preparation tool. Only the VA assigns ratings. Take your tracker to a free accredited Veterans Service Organization (DAV, VFW, American Legion, AMVETS, PVA) to file.
