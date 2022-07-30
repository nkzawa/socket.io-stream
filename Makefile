
REPORTER = dot

build:
	@./node_modules/.bin/browserify index.js -s ss > socket.io-stream.js

install:
ifeq ($(SOCKETIO_VERSION),)
	@npm install
else
	@npm install --cache-min 999999 socket.io@$(SOCKETIO_VERSION)
	@npm install --cache-min 999999 socket.io-client@$(SOCKETIO_VERSION)
endif

.PHONY: build install test
