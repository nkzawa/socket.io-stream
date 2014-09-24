
REPORTER = dot

build:
	@./node_modules/.bin/browserify index.js -s ss > socket.io-stream.js

install:
ifeq ($(SOCKETIO_VERSION), 0.9)
	@npm install --cache-min 999999 socket.io@0.9
	@npm install --cache-min 999999 socket.io-client@0.9
	@ln -fs ../../node_modules/socket.io-client/dist/socket.io.js test/support/socket.io.js
else
	@npm install
	@ln -fs ../../node_modules/socket.io-client/socket.io.js test/support/socket.io.js
endif

test: test-unit test-acceptance test-browser

test-unit:
	@./node_modules/.bin/mocha --reporter $(REPORTER)

test-acceptance:
	@./node_modules/.bin/mocha --reporter $(REPORTER) --bail \
		--timeout 6000 \
		test/acceptance/*.js

test-browser: test-browser-unit

test-browser-unit: build
	@./node_modules/.bin/mocha-phantomjs --reporter $(REPORTER) test/index.html

clean:
	find ./test -name "*.tmp" -exec rm {} +

.PHONY: build install test test-unit test-acceptance test-browser test-browser-unit clean
