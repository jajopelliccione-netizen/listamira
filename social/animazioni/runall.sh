#!/bin/bash
cd /home/user/listamira/social/animazioni
run(){ for s in $1; do node render.js $s $2; done; }
run "period assemblee snow eventi" bg &
run "serate annuario numeri vento" bg &
run "period assemblee snow eventi" alpha &
run "serate annuario numeri vento" alpha &
wait
echo ALLDONE
