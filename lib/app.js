'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Axel = function (_EventEmitter) {
    _inherits(Axel, _EventEmitter);

    function Axel(options) {
        _classCallCheck(this, Axel);

        var _this = _possibleConstructorReturn(this, (Axel.__proto__ || Object.getPrototypeOf(Axel)).call(this));

        _this.testAxel();

        if (!options) return _possibleConstructorReturn(_this);
        /*
            You  can  specify  a speed (bytes per second) here and Axel will
            try to keep the average speed around this speed. Useful  if  you
            don't want the program to suck up all of your bandwidth.
        */
        _this.maxspeed = options.maxspeed;
        /*
             You can specify an alternative number of connections here.
        */
        _this.connections = options.connections;
        /*
             You can specify an custom headers.
        */
        _this.headers = options.headers;

        _this.output = options.output;

        _this.speed = 0;
        _this.progress = 0.0;
        _this.size = 0;
        _this.errors = ['404 Not Found', '502 Bad Gateway', '504 Gateway Timeout'];

        return _this;
    }

    _createClass(Axel, [{
        key: 'getCommandWithArgs',
        value: function getCommandWithArgs() {
            var command = [];
            this.maxspeed ? command.push('-s ' + this.maxspeed) : '';
            this.connections ? command.push('-n ' + this.connections) : '';
            this.output ? command.push('-o ' + this.output) : '';

            if (this.headers) {
                this.headers.map(function (header) {
                    return command.push('-H' + header);
                });
            }
            return command;
        }
    }, {
        key: 'emitLines',
        value: function emitLines(stream) {
            var backlog = '';
            stream.on('data', function (data) {
                backlog += data;
                var n = backlog.indexOf('\n');
                // got a \n? emit one or more 'line' events
                while (~n) {
                    stream.emit('line', backlog.substring(0, n));
                    backlog = backlog.substring(n + 1);
                    n = backlog.indexOf('\n');
                }
            });
            stream.on('end', function () {
                if (backlog) {
                    stream.emit('line', backlog);
                }
            });
        }
    }, {
        key: 'download',
        value: function download(url) {
            var _this2 = this;

            this.defer = _q2.default.defer();

            if (!url) {
                this.emit('error', 'Invalid url');
                this.promise.reject('Invalid Url');
                return this.getProgress();
            }

            var command = this.getCommandWithArgs();
            command.push(url);
            var spawn = require('child_process').spawn('axel', command);

            process.on('exit', function () {
                spawn.kill();
            });

            this.emitLines(spawn.stdout);
            spawn.stdout.on('line', function (data) {
                // console.log('Line: ', data.toString());
                _this2.emit('progress', _this2.update(data));
            });
            spawn.stderr.on('data', function (data) {
                // console.log(`stderr: ${data}`);
                _this2.emit('error', data);
                _this2.defer.reject(data);
            });

            spawn.stdout.on('close', function () {
                // console.log('Close: ', data);
                _this2.progress = 100;
                _this2.speed = 0;
                _this2.emit('progress', _this2.getProgress());
                _this2.emit('finish');
                _this2.defer.resolve();
            });
            this.promise = this.defer.promise;
            return this;
        }
    }, {
        key: 'update',
        value: function update(line) {
            var _this3 = this;

            var progress = /\[\s+(\d+)%\]/.exec(line);
            if (progress && progress[1]) {
                this.progress = progress[1];
                // console.log('Progress :', this.progress);
            }
            var speed = /([0-9]+\.[0-9]+)KB\/s\]/.exec(line);
            if (speed && speed[1]) {
                this.speed = speed[1];
                // console.log('Speed : ', this.speed)
            }
            this.errors.map(function (error) {
                if (1 + line.indexOf(error)) {
                    _this3.emit('error', error);
                    _this3.defer.reject(error);
                }
            });

            if (!this.size) {
                var size = /File size: (\d+)/.exec(line);
                if (size && size[1]) {
                    this.size = size[1];
                    // console.log('Size : ', this.size)
                }
            }

            return this.getProgress();
        }
    }, {
        key: 'getProgress',
        value: function getProgress() {
            return {
                speed: this.speed,
                progress: this.progress,
                size: this.size
            };
        }
    }, {
        key: 'testAxel',
        value: function testAxel() {
            try {
                var child = require('child_process');
                var spawn = child.spawn('axel');
            } catch (error) {}
            spawn.on('error', function () {
                console.error('axel command not found');
            });
        }
    }]);

    return Axel;
}(_events2.default);

module.exports = Axel;
exports.default = Axel;