#!/bin/bash

ROOT=`dirname $PWD`
CDK_FOLDER="cgl-op-cdk"
LAYER_FOLDER="package-npm"
LAYER_FOLDER2="package-npm"

for entry in "$ROOT"/*
do
  if [[ $entry != *"$CDK_FOLDER"* && $entry != *"$LAYER_FOLDER"* && $entry != *"$LAYER_FOLDER2"* ]] 
  then
    cd $entry && rm -rf node_modules && rm -rf package-lock.json && npm install && npm run build
  fi
done
