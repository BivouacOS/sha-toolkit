# SHA Toolkit

This kit helps you prepare for your Separation Health Assessment (SHA) and VA disability claim. 
38 CFR Part 4 is 250 pages that I don't understand; however, after over a decade of service I know my body hurts.
Claude reads your medical records (after removing your personal information), asks you the SHA questions one at a time, and builds an Excel tracker of your likely conditions and estimated VA rating.

## How to start

What you need:
Computer
MHS GENESIS Patient Portal login
Paid Claude account

1. Install the Claude desktop app: https://claude.ai/download — sign in.
2. Download this kit: green **Code** button → **Download ZIP**. Unzip it somewhere easy to find, like your Desktop.
3. Open Claude, click **Code**, and choose the unzipped folder.
4. Type: `start`

This folder will tell Claude how to progress from there. By default, It will ask before installing anything.
Let Claude know if you want to stop any time; type `resume` later to pick up where you left off, or `update` after adding new records.

## Your privacy

- Don't type your PII into the chat terminals, those are not private to you.
- Claude never opens your original records (called raw in this program). You type your SSN, DoD ID and birth date into a LOCAL file on your own computer that only the cleanup scripts read to scrub your PII off of records.
- If you are hesitant on this, you can reach out and I can help you with a PII scrub on a homelab or server.

## What you get

`SHA Tracker.xlsx` with three sheets:

1. **Medical** — your conditions grouped by how ready they are to file, with diagnostic code, estimated %, evidence, and a running combined rating (38 CFR 4.25, with the 4.26 bilateral factor).
2. **Potential Conditions** — possible claims worth looking into.
3. **SHA Answers** — your answers, with the record that supports each one.

## Disclaimer
This is a preparation tool, not legal or medical advice, and it is obviously subject to mistakes by AI. This is a tool you can use to organize your claims, communicate with your primary care and VSO and better understand the 38 CFR part 4 regulation. 

It will always be free, and I will do my best to keep it updated at https://github.com/BivouacOS/sha-toolkit
