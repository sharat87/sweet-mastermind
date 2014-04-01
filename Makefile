SHELL := /bin/bash

package:
	rm -f mastermind.zip
	zip -r mastermind * -x \*.svg Makefile

icons: icons/icon-16.png icons/icon-128.png

icons/icon-16.png: icons/icon.svg Makefile
	inkscape -z -e icons/icon-16.png -w 16 -h 16 icons/icon.svg

icons/icon-128.png: icons/icon.svg Makefile
	inkscape -z -e icons/icon-128.png icons/icon.svg
	convert icons/icon-128.png -gravity center -background transparent \
		-extent 128x128 icons/icon-128.png

.PHONY: icons package
