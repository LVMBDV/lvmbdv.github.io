---
title: Remote backups with Restic and Backblaze B2
date: 2019-10-22
categories:
  - tutorial
tags:
  - sysadmin
  - backups
  - restic
---

Restic is a program that greatly simplifies the process of encrypted,
incremental backups. Backblaze B2 is a [pretty cheap](https://www.backblaze.com/b2/cloud-storage-pricing.html)
cloud storage service that restic happens to support as a data storage
backend. The first 10 GB of storage is free, which is plenty for
storing configuration files and some source code.

<!--more-->

Before we go about setting things up, we need to expand on Backblaze's
pricing model. Downloading is $0.01 per GB with the first 1 GB free
each day but there are also seperate "class B transactions" which
include API calls like `b2_download_file_by_id` which are counted per
call and not bandwidth usage. The first 2500 of these calls are free
each day, then they are $0.004 per 10000 calls. Restic indexes
encrypted data chunks for deduplication so there might be more API
calls in a backup restoration than you might expect. Although I don't
think it'll make too much of a difference on your invoice, I feel
obligated to properly inform you before we proceed to actually set up
restic with Backblaze B2.

To get started, sign up on [backblaze.com](https://www.backblaze.com)
and create a bucket and an application key for that bucket. If you
want to set up restic for multiple computers, you might want to set up
seperate buckets and application keys for each so if a computer is
compromised, only that computer's backups may be compromised.

Install a recent version of
[restic](https://restic.readthedocs.io/en/stable/020_installation.html),
and then create a restic repo on your bucket:

```shell
export B2_ACCOUNT_ID="your account id or application key id"
export B2_ACCOUNT_KEY="your secret account key or application key"

restic -r b2:your-bucket:/desired/path/to/your-restic-repo init
```

You will be asked to enter a password during the initialization of
your repo. Make sure you do not lose this as you need it to unlock the
private key used to decrypt the repo content each time you access it. Now that
you created your repo, you can create as many backups as you like. I
usually back up my configuration files and most of my home directory.

```shell
# assuming the exports we made above are still present
export RESTIC_PASSWORD="very-secret-go-away"

restic -r b2:your-bucket:/desired/path/to/your-restic-repo backup /etc ~/{Pictures,Documents,Projects,Work}
```

This should scan all the directories you listed and create a snapshot
of their state at that moment. You might want to store daily backups
up to 30 days, which means deleting snapshots older than 30 days and
only keeping the latest snapshot for each day. You can do this using
`restic forget` like so:

```shell
# assuming the exports we made above are still present
restic -r b2:your-bucket:/desired/path/to/your-restic-repo forget --keep-daily 30
```

Keep in mind that this will not make restic delete the underlying data
chunks that might only be valid for the deleted snapshots. To properly
delete snapshots and prune the indexed data, you need to add the
option `--prune` to your forget command. Even though restic uses a
local cache to store metadata on these chunks, you'll still see a
small surge in your class B transactions with prune operations.

Note that your hostname is stored with each snapshot. By default, the
`forget` command groups your snapshots by the paths they target and
which host the snapshot was made on. You can change this behaviour in
all kinds of ways for [more advanced uses](https://restic.readthedocs.io/en/stable/060_forget.html#removing-snapshots-according-to-a-policy).

You can also check the integrity of your backups with the `check`
command. You should do it often to ensure you'll have a solid backup
to restore from when the time comes.

I have been using restic for about a few weeks now and I use a script
like so, ran by a daily cronjob.

```shell
#!usr/bin/env bash

export B2_ACCOUNT_ID='secret'
export B2_ACCOUNT_KEY='secret'
export RESTIC_PASSWORD='secret'
export RESTIC_REPOSITORY='b2:supersecret:restic-repo'

restic backup /etc /var/log && \
restic forget --host "$HOSTNAME" --keep-daily 30 --prune

mail -s "$HOSTNAME backup $(test $? -eq 0 && echo 'successful' || echo 'failed') on $(date +%d-%m-%Y\ %R)" 'my-mail@address.ru' <<< "$(restic snapshots)
```
