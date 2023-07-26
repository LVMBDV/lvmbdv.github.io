---
title: I did a thing at Harekaze 2018
date: 2018-03-01
categories:
  - writeup
tags:
  - ctf
  - cryptology
  - python
---

I participated in DKHOS alongside bloodlust (formerly yubitsec) this year but
this post is not about that. While we were waiting for DKHOS to start at
midnight, we decided to warm up with another CTF that was going on at the time.
That CTF was Harekaze 2018.

<!--more-->

I could solve only one challenge in the limited time before midnight and it was
a crypto one named "gacha". It came with an address, a port number and the
python source code for the service running at that address.

After a quick glance, you notice variable names like `p`, `q` and `n` together.
This rings a bell for anyone familiar with RSA.

```python
# generate params
p = [ getPrime(1024) for _ in range(3) ]
q = [ getPrime(1024) for _ in range(3) ]
n = [ p[i] * q[i] for i in range(3) ]
e = 65537
d = [ invert(e, (p[i] - 1) * (q[i] - 1)) for i in range(3) ]
m = [ bytes_to_long(['WIN 💎', 'LOSE 💩'][bool(i)].encode()) for i in range(3) ]
c = [ pow(m[i], e, n[i]) for i in range(3) ]
```

The challenge needs you to "guess" which of the three RSA encrypted messages is
the `WIN` one after it gives you the public key, the exponent and the cipher
text of each one. You are given the flag after you have a success rate of at
least 0.9 over at least 30 iterations.

```python
# receive the choice
for x, i in enumerate(f):
    print('    🔒 %d. (%#x, %d, %#x)' % (x + 1, n[i], e, c[i]))
print('[*] select:')
k = f[int(input('>>> ')) - 1]

# check the result
result = long_to_bytes(pow(c[k], d[k], n[k])).decode()
print('[*] result:', result)
if 'WIN 💎' in result:
    print('[+] you win 🎉')
    win += 1
else:
    print('[!] you lose')
```

The private key components `p` and `q` are randomly selected each time so that
part looks solid. They are quite big too, so no way to factor the public key in
time. No attack path there.

```python
p = [ getPrime(1024) for _ in range(3) ]
q = [ getPrime(1024) for _ in range(3) ]
```

Further analysis of the source code reveals that there are only two possible
plaintext messages which are the words `WIN` and `LOSE` with some emojis at
the end of them.

```python
m = [ bytes_to_long(['WIN 💎', 'LOSE 💩'][bool(i)].encode()) for i in range(3) ]
```

I realized I could figure out which one was the WIN string by encrypting it
with each public key given and comparing that to the given ciphertext. In
conclusion, the vulnerability here was the limited message space.

Then I wrote a python script to interract with the server and try to pick the
right ciphertext each time using this method. Here is it.

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from Crypto.Util.number import *
from gmpy2 import *
from flag import FLAG
from signal import *
import socket

WIN = 6289644257982517902
LOSE = 1407668537961767473833
e = 65537
WIN_ME = WIN ** e

print("precalculated WINME")

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(("problem.harekaze.com", 30214))
buf = bytes()

choices = {}

def answer(choices):
    for key in choices:
        n, c = choices[key]
        if (WIN_ME % n) == c:
            return (key + 1)
    return 1

while True:
    c = sock.recv(1)
    if c == b"\n":
        if len(buf) == 0:
            continue
        line = buf.decode()
        if line.startswith("[*] ROUND"):
            r = int(line.split()[-1])
            choices[r] = {}
        elif line.startswith("["):
            print(line)
        elif line.startswith("    🔒 "): # pubkey start
            splat = line.split(" ", 6)[5:]
            index = int(splat[0][:-1]) - 1
            n, e, c = eval(splat[1])
            choices[r][index] = (n, c)
        elif line.startswith("    🔑 "): # privkey start
            splat = line.split(" ")
        buf = bytes()
    elif buf == b">>>":
        ans = (str(answer(choices[r])) + "\r\n")
        # print("sent answer: %s" % ans)
        sock.sendall(ans.encode())
        buf = bytes()
    else:
        buf += c
```

P.S. There are some unnecessary lines but I kept them for authenticity :^)
