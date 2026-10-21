# messageforyou 💌

**Make a gift she will remember, and send it as a link.**

messageforyou lets you build a small, private "museum" for someone you love. You fill in a few steps, preview exactly what they will see, and get a link to send. It's free, and nobody needs an account.

Inspired by the idea behind ourmoments.live.

## What it does

**You (the sender) go through 7 short steps:**
1. Her name, your name, and the first line she reads
2. What the day is for, what she is to you, and the colours (soft, silly, fire, ride or die)
3. Up to 8 photos with captions. One becomes a puzzle she has to put back together
4. Up to 5 reasons you love her, a love letter, a wax seal and a sticker
5. A voice message of up to 45 seconds (optional)
6. Up to 5 promises you will keep
7. A full preview. You walk through it yourself first, then get the link

**She (the receiver) opens the link and goes through:**
- A gift box that opens into a shower of roses
- "From me to you.", with a sketched couple
- A bow she pulls back to shoot an arrow into a glowing heart
- A big title card and a tree that blooms with hearts
- A door she knocks on three times
- **Room 1:** photos hidden under gold foil that she scratches away
- **Room 2:** a photo puzzle to put back together
- **Room 3:** sticky notes with your reasons
- **Room 4:** a sealed letter. She breaks the wax, and the letter types itself out. Your voice message plays here
- **Room 5:** a promises certificate she ticks, then you seal it with a stamp
- **The finale:** a keepsake card with the number of days you have been together. She can press and hold it to save it as a picture

It works on phones and computers, with soft background music you can turn on or off.

## Running it on your computer

You need **Node.js** and **MongoDB** installed.

1. Start MongoDB (on a Mac: `brew services start mongodb-community`).
2. In the `server` folder, copy `.env.example` to `.env`, then run `npm install` and `npm run dev`.
3. In the `client` folder, run `npm install` and `npm run dev`.
4. Open **http://localhost:5180**.

(On a Mac, port 5000 is used by AirPlay, so this app uses 5055 for the server.)

## Putting it online for free

The simplest free setup is **MongoDB Atlas** for storing gifts and **Render** for hosting the app. The app is not fully ready for that yet. Photos and voice messages are saved on the server's disk, and free hosts wipe that disk when they restart. Before going live they need to be stored somewhere permanent, for example in the database.

Also, free hosts put the site to sleep when nobody visits, so the first visit after a quiet spell can take about a minute to load.

## Your own music

By default the app plays a gentle music-box tune that it makes itself. To use your own song, put an MP3 you have the rights to at `client/public/music/bgm.mp3`.

## Good to know

- Gifts can't be edited after the link is created, so use the preview.
- Limits: 8 photos, 5 notes, a 500-character letter and 5 promises.
- The server remembers how many times each link was opened.

## What's in the folders

- `client/`: the website (what people see)
- `server/`: saves gifts, photos and voice messages
- `DESIGN.md` and `CONTRACT.md`: design and build notes from when it was made
