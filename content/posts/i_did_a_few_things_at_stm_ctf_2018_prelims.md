---
title: I did a few things at STM CTF 2018 Prelims
date: 2018-10-01
categories:
  - writeup
tags:
  - ctf
  - python
---

Here are a few challenges I chose to write about from the preliminary for STM CTF 2018 which
will take place in Ankara at Oct 31. I want to thank the STM team for a fun and smooth CTF
experience. I started competing in CTFs about half a year ago and I heard good things about
STM CTF 2017. I hope I can attend this year :)

<!--more-->

## DiEfAyAr

We are given a yara file and a binary data file. The yara rule matches the
file. The yara rule looks like this:

```
rule APT58_Temp_Watercity {
	
	meta:
		description = "Detects malware from notorious hacker group supported by Sivas"
		in_the_wild = true

	strings:
		<snip, irrelevant>

	condition:
		all of them and
		$s7 at 0 and
		uint16(uint8(uint8(uint8(uint8(uint8(0x79)))))) == 0x6c66 and
		uint16(uint8(uint8(uint8(uint8(uint8(0x69)))))) == 0x6761 and
		uint8(0x2aa) == 0x7d and
		filesize == 792
```

The `uint16(uint8(uint8(uint8(uint8(uint8(` syntax is basically nested
`Load Effective Address` instructions with specified word length.

```text
uint16( 0x666c
	uint8( 0x5f _
		uint8( 0x6d m
			uint8( 0x61 a
				uint8( 0x72 r
					uint8(0x79 y)))))) 0x34 4

uint16( 0x6167
	uint8( 0x65 e
		uint8( 0x44 D
			uint8( 0x52 R
				uint8( 0x33 3
					uint8(0x69 i)))))) 0x63 c
```

So the flag is `STMCTF{y4ram_ic3Rde}`.

## Rengarenk String

We are given an image and told that the color values have a meaning.

<img src="/img/rengarenk_string.png"/>

It doesn't have any transparency so we extract RGB data in order, with GIMP.

```shell
atak@silver ~>xxd rengarenk_string.dat
00000000: acab b2bc abb9 84ad cc91 98cb 8d9a 9194  ................
00000010: a0bd 968d a0bb 8a91 869e a0b6 9c96 91a0  ................
00000020: b79a 8da0 ac9a 919a a0ad 9a91 9493 96a0  ................
00000030: bd96 8da0 ac90 8d8a a0ac 908d 9e93 9692  ................
00000040: a0ac 9685 a0bb 9aa0 bc90 858a 91a0 ba98  ................
00000050: 939a 9196 91a0 bb9a 9b96 94a0 b686 96a0  ................
00000060: a69e 8f8b 9694 a092 96a0 c0a0 cecd cccb  ................
00000070: cac9 c8c7 c6a0 cecd cccb cac9 c8c7 c6a0  ................
00000080: cecd cccb cac9 c8c7 c6a0 cecd cccb cac9  ................
00000090: c8c7 c6a0 a69e 9391 9685 a0b1 9aa0 aa85  ................
000000a0: 8a91 a0b9 939e 98a0 b093 9b8a a0bd 8aa0  ................
000000b0: bd90 8693 9aa0 b19a 868c 9aa0 b796 9ca0  ................
000000c0: bb9a 9896 938c 9aa0 b2bb caa0 be93 9686  ................
000000d0: 908d 8a85 a0aa 858a 9193 8a94 a0be 8691  ................
000000e0: 96a0 b49e 9396 8690 8da0 c4d6 a0c5 d682  ................
```

It doesn't look very human-friendly yet it doesn't look completely random
either. Let's check the distribution of byte values.

```shell
atak@silver ~>xxd -p -c 1 rengarenk_string.data | sort | uniq -c | sort -n
      1 82
<snip, too long>
      6 9e
      7 86
      8 8d
      9 8a
     11 93
     13 91
     14 9a
     17 96
     39 a0
```

Assuming this is a flag, `0xA0` probably corresponds to underscore since it's
used to break words in STM CTF flags. `0xA0` also happens to be the one's
complement of `0x5F` which is the ASCII value of the underscore character.
Let's try to flip every bit in that file.

```python
>>> data = open("rengarenk_string.dat","rb").read()
>>> "".join(map(lambda b: chr(ord(b) ^ 0xFF), data))
'STMCTF{R3ng4renk_Bir_Dunya_Icin_Her_Sene_Renkli_Bir_Soru_Soralim_Siz_De_Cozun_Eglenin_Dedik_Iyi_Yaptik_mi_?_123456789_123456789_123456789_123456789_Yalniz_Ne_Uzun_Flag_Oldu_Bu_Boyle_Neyse_Hic_Degilse_MD5_Aliyoruz_Uzunluk_Ayni_Kaliyor_;)_:)}'
```

And voila, there's the flag.

## Matruşka

We are given an executable, named `matruşka.exe`.

```shell
atak@silver Matruşka>file matruşka.exe
matruşka.exe: PE32 executable (console) Intel 80386, for MS Windows
```

If we try to run it with wine because who runs Windows in the year of the Linux
Desktop, we run into a Python stacktrace. I'm pretty sure that was not intended
but that's okay, we learned that this is a "compiled" Python script. So we
unpack it with
[python-exe-unpacker](https://github.com/countercept/python-exe-unpacker).

```shell
atak@silver Matruşka>./python_exe_unpack.py -i ./matruşka.exe
[*] On Python 2.7
[*] Processing ./matruşka.exe
[*] Pyinstaller version: 2.1+
[*] This exe is packed using pyinstaller
[*] Unpacking the binary now
[*] Python version: 27
[*] Length of package: 3224163 bytes
[*] Found 18 files in CArchive
[*] Beginning extraction...please standby
[*] Found 194 files in PYZ archive
[*] Successfully extracted pyinstaller exe.
atak@silver Matruşka>cd unpacked/matruşka.exe/
atak@silver matruşka.exe>ls
 bz2.pyd                       pyimod02_archive
 _hashlib.pyd                  pyimod03_importers
 Microsoft.VC90.CRT.manifest  'pyi-windows-manifest-filename rev.exe.manifest'
 msvcm90.dll                   python27.dll
 msvcp90.dll                   rev
 msvcr90.dll                   rev.exe.manifest
 out00-PYZ.pyz                 select.pyd
 out00-PYZ.pyz_extracted       struct
 pyiboot01_bootstrap           unicodedata.pyd
 pyimod01_os_path
```

Poking around a bit, we realize the `rev` file is pretty interesting.

```shell
atak@silver matruşka.exe>xxd rev
00000000: 6300 0000 0000 0000 0003 0000 0040 0000  c............@..
00000010: 0073 3000 0000 6400 0064 0100 6c00 005a  .s0...d..d..l..Z
00000020: 0000 6402 006a 0100 6403 0083 0100 5a02  ..d..j..d.....Z.
00000030: 0065 0000 6a03 0065 0200 8301 0064 0100  .e..j..e.....d..
00000040: 0455 6401 0053 2804 0000 0069 ffff ffff  .Ud..S(....i....
00000050: 4e73 cc03 0000 5977 4141 4141 4145 4141  Ns....YwAAAAAEAA
00000060: 4141 4b51 4141 4145 4d41 4141 427a 4b41  AAKQAAAEMAAABzKA
00000070: 4541 4147 5142 4147 6f41 4147 6341 4147  EAAGQBAGoAAGcAAG
<snip, too long>
000003f0: 526f 6232 356c 6543 3577 6558 5144 4141  Rob25leC5weXQDAA
00000400: 4141 5933 526d 4241 4141 4148 4d4b 4141  AAY3RmBAAAAHMKAA
00000410: 4141 4141 466c 4151 7742 4441 4769 4167  AAAAFlAQwBDAGiAg
00000420: 3d3d 7406 0000 0062 6173 6536 3428 0400  ==t....base64(..
00000430: 0000 7407 0000 006d 6172 7368 616c 7406  ..t....marshalt.
00000440: 0000 0064 6563 6f64 6574 0700 0000 7061  ...decodet....pa
00000450: 796c 6f61 6474 0500 0000 6c6f 6164 7328  yloadt....loads(
00000460: 0000 0000 2800 0000 0028 0000 0000 7306  ....(....(....s.
00000470: 0000 0072 6576 2e70 7974 0800 0000 3c6d  ...rev.pyt....<m
00000480: 6f64 756c 653e 0100 0000 7304 0000 000c  odule>....s.....
00000490: 010f 01                                  ...
```

So we have a base64 encoded marshall object in there. Let's carve it out and
import it.

```python
>>> import marshal
>>> with open("sus.marshal","rb") as mf:
...     hmm = marshal.load(mf)
...
>>> hmm
<code object ctf at 0x7fbb5dd36e30, file "pythonex.py", line 4>
```

After a bit of research, we learn that you can disassemble code objects.

```python
>>> import dis
>>> dis.dis(hmm)
  5           0 LOAD_CONST               1 ('')
              3 LOAD_ATTR                0 (join)
              6 BUILD_LIST               0
              9 LOAD_CONST               2 ('y')
             12 LOAD_CONST               3 ('_')
             15 LOAD_CONST               4 ('5')
             18 LOAD_CONST               5 ('w')
             21 LOAD_CONST               2 ('y')
             24 LOAD_CONST               6 ('&')
             27 LOAD_CONST               7 ('d')
             30 LOAD_CONST               8 ('8')
             33 LOAD_CONST               9 ('r')
             36 LOAD_CONST              10 ('6')
             39 LOAD_CONST              11 ('s')
             42 LOAD_CONST               7 ('d')
             45 LOAD_CONST               9 ('r')
             48 LOAD_CONST              10 ('6')
             51 LOAD_CONST              12 ('x')
             54 LOAD_CONST              10 ('6')
             57 LOAD_CONST              11 ('s')
             60 BUILD_LIST              17
             63 GET_ITER
        >>   64 FOR_ITER                28 (to 95)
             67 STORE_FAST               0 (x)
             70 LOAD_GLOBAL              1 (chr)
             73 LOAD_GLOBAL              2 (ord)
             76 LOAD_FAST                0 (x)
             79 CALL_FUNCTION            1
             82 LOAD_CONST              13 (3)
             85 BINARY_ADD
             86 CALL_FUNCTION            1
             89 LIST_APPEND              2
             92 JUMP_ABSOLUTE           64
        >>   95 CALL_FUNCTION            1
             98 STORE_FAST               1 (passw)

  6         101 LOAD_GLOBAL              3 (raw_input)
            104 LOAD_CONST              14 ('bul parolayi al flagi : ')
            107 CALL_FUNCTION            1
            110 STORE_FAST               2 (parola)

  7         113 LOAD_FAST                1 (passw)
            116 LOAD_FAST                2 (parola)
            119 COMPARE_OP               2 (==)
            122 POP_JUMP_IF_FALSE      287

  8         125 LOAD_CONST               1 ('')
            128 LOAD_ATTR                0 (join)
            131 BUILD_LIST               0
            134 LOAD_CONST              15 ('}')
            137 LOAD_CONST              16 ('1')
            140 LOAD_CONST              17 ('$')
            143 LOAD_CONST              18 ('3')
            146 LOAD_CONST              19 ('m')
            149 LOAD_CONST              20 ('7')
            152 LOAD_CONST              21 ('z')
            155 LOAD_CONST               3 ('_')
            158 LOAD_CONST              16 ('1')
            161 LOAD_CONST              22 ('Y')
            164 LOAD_CONST              23 ('4')
            167 LOAD_CONST              24 ('e')
            170 LOAD_CONST              23 ('4')
            173 LOAD_CONST              25 ('l')
            176 LOAD_CONST               3 ('_')
            179 LOAD_CONST              16 ('1')
            182 LOAD_CONST              26 ('f')
            185 LOAD_CONST              18 ('3')
            188 LOAD_CONST              27 ('g')
            191 LOAD_CONST              28 ('0')
            194 LOAD_CONST               2 ('y')
            197 LOAD_CONST              16 ('1')
            200 LOAD_CONST              19 ('m')
            203 LOAD_CONST              16 ('1')
            206 LOAD_CONST              12 ('x')
            209 LOAD_CONST               3 ('_')
            212 LOAD_CONST              29 ('h')
            215 LOAD_CONST              18 ('3')
            218 LOAD_CONST               3 ('_')
            221 LOAD_CONST              12 ('x')
            224 LOAD_CONST              17 ('$')
            227 LOAD_CONST              23 ('4')
            230 LOAD_CONST              30 ('{')
            233 LOAD_CONST              31 ('S')
            236 LOAD_CONST              32 ('G')
            239 LOAD_CONST              33 ('P')
            242 LOAD_CONST              34 ('Z')
            245 LOAD_CONST              32 ('G')
            248 LOAD_CONST              35 ('F')
            251 BUILD_LIST              39
            254 GET_ITER
        >>  255 FOR_ITER                21 (to 279)
            258 STORE_FAST               3 (e)
            261 LOAD_FAST                3 (e)
            264 LOAD_ATTR                4 (decode)
            267 LOAD_CONST              36 ('ROT13')
            270 CALL_FUNCTION            1
            273 LIST_APPEND              2
            276 JUMP_ABSOLUTE          255
        >>  279 CALL_FUNCTION            1
            282 PRINT_ITEM
            283 PRINT_NEWLINE
            284 JUMP_FORWARD             5 (to 292)

 10     >>  287 LOAD_CONST              37 ('tutmadi be ..')
            290 PRINT_ITEM
            291 PRINT_NEWLINE
        >>  292 LOAD_CONST               0 (None)
            295 RETURN_VALUE
```

We could put the password back together, re-assemble the program and run it to
get the flag but the flag is right there, so we just reverse and ROT13 it and
recover it, it's `STMCTF{4$k_3u_k1z1l0t3s1_y4r4L1_m7z3$1}`.
