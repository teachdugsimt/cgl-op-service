#!/bin/bash

ROOT=`dirname $PWD`
CDK_FOLDER="hino-gpsi-api-cdk"
LAYER_FOLDER="initial-layer-v1"

for entry in "$ROOT"/*
do
  if [[ $entry != *"$CDK_FOLDER"* && $entry != *"$LAYER_FOLDER"* ]] 
  then
    cd $entry && npm run build
  fi
done
