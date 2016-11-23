# Petridish-Ogar
Want to make an agario clone that'll have lots of custom modes, good physics and won't lag like hell? Petridish Ogar is for you!
# Client and Server
The client is based on petridish.pw's client. The server is based on MultiOgar ([this version](https://github.com/Barbosik/MultiOgar/commit/f09541954419f5bc6e6f9ef000446fdc1c36913d)), however, due to protocol changes, protocol 4/5/6 clients will not be able to connect to it. Use the client included by default.
# Petridish Ogar server features
Minions

Improved cell collisions

Custom Petridish.pw modes

Food grow

Improved performance up to 20% compared to MultiOgar

Map flipping - anti-teaming measure from vanilla (No more saying like "Go to top left corner"). Teamers will end up in different corners!

Mass gain factor - gain only some mass instead of all when eating other players' cells - a better alternative to anti-teaming

Extra Minion features - give minions to players by default, change their starting mass and speed
# Demo
[Play on the demo server.](http://polarsbots.ml/)
512 cells with 14 mass - semi-stable (need to arrange cells to avoid jitter)
![a](http://i.imgur.com/z7xTxun.png)
More Demos coming soon...

# Frequently Asked Questions
Q: Will you add client-side anti-bot protections?
A: Doing important things client-side is dangerous as a hacker can edit the client and bypass it. Only server-side bot protections will be added.
Q: Why after some of your "optimizations" my server runs slower?
A: I optimize the code according to how a programmer would think how fast the program runs before and after the optimizations. If it runs slower, it's V8's fault, not mine.
