# SHA Toolkit

This kit helps you prepare for your Separation Health Assessment (SHA) and VA disability claim. 
38 CFR Part 4 is 250 pages that I don't understand; however, after over a decade of service I know my body hurts.
Claude reads your medical records (after removing your personal information), asks you the SHA questions one at a time, and builds an Excel tracker of your likely conditions and estimated VA rating.

## How to start

What you need:
Computer
Paid Claude account
(highly recommended...) MHS GENESIS Patient Portal login

If you use Claude Code in a terminal: open a terminal in the unzipped folder, run claude, and type start.
If you are not as technical I recommend:

1. Install the Claude desktop app: https://claude.ai/download — sign in.
2. Download this kit: green **Code** button → **Download ZIP**. Unzip it somewhere easy to find, like your Desktop.
3. Open Claude, click **Code**, and choose the folder that contains START HERE.txt.
4. Type: `start`

This folder will tell Claude how to progress from there. By default, it will ask before installing anything.
Let Claude know if you want to stop any time; type `resume` later to pick up where you left off, or `update` after adding new records.

## Your privacy

- Don't type your PII into the chat terminals, those are not private to you.
- Claude is instructed never to open your original records (the /raw folder); local scripts remove your personal information first. The cleaned records (diagnoses, notes, test results) are then read by Claude, which means that information is sent to Anthropic servers.
-  You type your name, SSN, DoD ID and birth date into a LOCAL file on your own computer that only the cleanup scripts read to scrub your PII off of records.

## What you get

`SHA Tracker.xlsx` with three sheets:

1. **Medical** — your conditions grouped by how ready they are to file, with diagnostic code, estimated %, evidence, and a running combined rating (38 CFR 4.25, with the 4.26 bilateral factor).
2. **Potential Conditions** — possible claims worth looking into.
3. **SHA Answers** — your answers, with the supporting record, when there is one.

## Disclaimer
Not Legal or Medical Advice: This is a free, self-help organizational tool, not professional advice. Always verify your claims with an accredited VSO or medical provider before submission.

AI Makes Mistakes: This toolkit uses Claude to estimate ratings based on 38 CFR Part 4. AI can hallucinate, misread records, or calculate ratings incorrectly. You are solely responsible for verifying all outputs.

Your Privacy, Your Responsibility: All PII scrubbing runs locally on your machine. You are responsible for ensuring your data is fully redacted before it is sent to Anthropic's servers.

Provided "As-Is": THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM THE USE OF THIS SOFTWARE.

It will always be free, and I will do my best to keep it updated at https://github.com/BivouacOS/sha-toolkit
