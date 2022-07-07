#!/bin/bash

# Download temperature data from envidata.cz
# ------------------------------------------
# Prerequisites: awk, wget

SCRIPT_DIR=$(dirname $0)
DOWNLOAD_DIR="$SCRIPT_DIR/envidata"
STATIONS_FILE="$SCRIPT_DIR/station-ids.txt"

if [ ! -d "$DOWNLOAD_DIR" ]; then
    mkdir "$DOWNLOAD_DIR"
    echo "Created directory $DOWNLOAD_DIR for downloads"
fi

awk -F'\t' '$2 != "-" { print }' < "$STATIONS_FILE" | \
    while IFS=$'\t' read -r STATION_NAME STATION_ID
do
    DEST_FILE="$DOWNLOAD_DIR/$STATION_ID.csv"
    if [ -f "$DEST_FILE" ]; then
        echo -e "Data for \e[36m$STATION_NAME\e[0m already present in \e[35m$DEST_FILE\e[0m"
        continue
    fi

    echo -e "Downloading data for \e[36m$STATION_NAME\e[0m..."
    wget --no-verbose -O "$DEST_FILE" \
        "https://www.envidata.cz/projects/faktaOKlimatu/export.php?type=raw&ID=$STATION_ID"

    echo -e "Data for \e[36m$STATION_NAME\e[0m saved to \e[35m$DEST_FILE\e[0m"
done

