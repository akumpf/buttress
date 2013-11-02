
# The Chaos Collective: NodeJS Library 

![ChaosLibClient](img/banner_720x135.jpg) 

Rapid Prototyping library for NodeJS (on the server).

# KERNEL

## kernel_db

The *kernel_db* module provides simple access to a core set of database operations on the server including management of data for:

* Sessions: Persistant session management via express/cookies.
* Projects: A list of proposed, ongoing, and archived projects and ideas.
* Users: Lightweight user managament for keeping track of who's who.

## kernel_sessions

The *kernel_sessions* module hooks into the *kernel_db* and takes care of session management.

## kernel_app

The *kernel_app* module adds basic functionality useful across all apps.

* getClientIP(req): Try to get the IP address by accessing header information in the user request object.
* getClientIpBase36(req): Get the IP address, then convert it to Base36 (nice and compact for storing/printing) user info.

# UTILS

## log

HTML logging by level of importance.

* log1(msg): low importance
* log7(msg): high importance
* log8(msg): very high (warning level)
* log9(msg): ultra high (error level)
 

