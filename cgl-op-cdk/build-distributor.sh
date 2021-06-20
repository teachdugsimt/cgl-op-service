#!/bin/bash

ROOT=`dirname $PWD`
CDK_FOLDER="cgl-op-cdk"
LAYER_FOLDER="package-npm"
LAYER_FOLDER2="cgl-op-master-data-service"

for entry in "$ROOT"/*
do
  if [[ $entry != *"$CDK_FOLDER"* && $entry != *"$LAYER_FOLDER"* && $entry != *"$LAYER_FOLDER2"* ]] 
  then
    cd $entry && rm -rf node_modules && npm install && npm run build
  fi
done
