#!/bin/bash
cd /home/user/listamira/social/animazioni
(node render.js numeri bg; node render.js vento bg) &
(node render.js numeri alpha; node render.js vento alpha) &
(node render.js annuario bg) &
(node render.js annuario alpha) &
wait; echo RERUNDONE
