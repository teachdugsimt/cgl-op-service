#!/bin/bash

ROOT=`dirname $PWD`
CDK_FOLDER="cgl-op-cdk"
LAYER_FOLDER="utility-layer"

for entry in "$ROOT"/*
do
  if [[ $entry != *"$CDK_FOLDER"* && $entry != *"$LAYER_FOLDER"* ]] 
  then
    cd $entry && npm run build
  fi
done
