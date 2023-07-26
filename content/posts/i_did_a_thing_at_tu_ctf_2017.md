---
title: I did a thing at TU CTF 2017
date: 2017-12-04
categories:
  - writeup
tags:
  - ctf
  - cryptology
  - python
---

It was called “The Neverending Crypto”. I don’t remember what difficulty level
it was listed at, probably the lowest :) Here is how it went.

You are presented with an address and a port number. When you connect, you are
asked to enter a string. The string you entered is encrypted and sent back to
you. After a few tries, I realize it’s encrypted with a Caesar cipher.

<!--more-->


```nohighlight
atak@silver ~>nc neverending.tuctf.com 12345
---------------------------------------
Welcome to The Neverending Crypto!
How fast can you solve it?
Round 1. Give me some text: abc
abc encrypted is %&'
What is (328C83C decrypted?
```

After they encrypt your string, they ask you to decrypt their string which
presumably has been encrypted with the same key. I didn’t even try to solve one
manually because it timed out after a few seconds. I decided to write a script
for it in Python and I started by writing a function to deduce a key when given
both the plaintext and ciphertext then another function for decryption.

```python
printable = "".join(map(chr, range(0x20, 0x7F)))

def deduce_key(p, c):
    return printable.index(c) - printable.index(p)

def decrypt(c, k):
    return printable[(printable.index(c) - k) % len(printable)]
```

That printable is there because I initially thought the alphabet used with the
cipher was all printable ASCII characters but I was wrong. I will come back to
this.

After that, I wrote an ugly loop that used one fixed character to deduce the key
and decrypt the given string until the connection ended.

```python
TEST_CHAR = "a"

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect(("neverending.tuctf.com", 12345))
    buf = ""
    while True:
        if buf.endswith("Give me some text:"):
            s.send((TEST_CHAR + "\n").encode("ascii"))
            buf += s.recv(16).decode("ascii")
            c = buf[-1]
            k = deduce_key(TEST_CHAR, c)
            print("Found key:", k)
            buf = ""
        elif buf.endswith(" decrypted?\n:"):
            ct = buf[buf.find("What is ") + len ("What is "):buf.find(" decrypted")]
            print(ct)
            pt = "".join(map(lambda c: decrypt(c, k), ct)) + "\n"
            print("Decrypted:", pt.strip())
            s.send(pt.encode("ascii"))
            buf = ""
        c = s.recv(1).decode("ascii")
        if len(c) == 0:
            break
        else:
            buf += c
    print(buf.strip())
```

It kinda worked but the answers, which looked like `you!crypto!wiz%`, weren’t
being accepted. After a few minutes of head-scratching I realized the characters
that looked odd were the ones that wrapped around the alphabet and started back
at the first character. Through trial and error, I deduced that the alphabet was
actually the range of `[0x20, 0x7F]` in ASCII. After that, it just worked :)

```nohighlight
atak@silver ~>python3 neverend.py
Found key: 8
{wum|pqvo(pmzm6
Decrypted: something here.
Found key: -35
VLR\E>SB\PHFIIP
Decrypted: you have skills
Found key: 27
5+1;#+0;(1~'5II
Decrypted: you got lucky..
Found key: -63
:06@$3:150@8*;A
Decrypted: you crypto wiz!

* snip, about 30 more later *

Found key: -22
]YWO^RSXQiRO\Ow
Decrypted: something here.
Correct!
Round complete!
TUCTF{wh0_w@s_her3_la5t_ye@r?!?}
That's all folks. What did you think there would be more?
```

That was fun. I remember solving another challenge just like this in one of the
wargames at <https://overthewire.org>.

PS In retrospect, Python 3’s unicode strings made things a bit more complicated
than they should be. Maybe I should have used 2.
