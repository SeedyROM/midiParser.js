'use strict';

function MIDIParser(url) {
    url = url || undefined;
    if(url) this.loadData(url);
}

MIDIParser.prototype.popBytes = function(amount, type) {
    type = type || 'integer';

    var bytes;
    switch(type) {
        case 'hex':
            bytes = this.state_buffer.splice(0, amount).map(function(byte) {
                return byte.toString(16);
            }).join('');
        break;
        case 'integer':
            bytes = this.state_buffer.splice(0, amount).map(function(byte) {
                return byte.toString(16);
            }).join('');
            bytes = parseInt(bytes, 16);
        break;
    }

    return bytes;
};

MIDIParser.prototype.resetBufferState = function() {
    this.state_buffer = this.buffer.slice();
}

MIDIParser.prototype.getHeaderAndVerify = function() {
    var headerStart = this.popBytes(4, 'hex');
    if(headerStart !== '4d546864') throw 'Invalid midi file!';

    this.fileInfo = {
        format: this.popBytes(2),
        trackChunks: this.popBytes(2),
        division: this.popBytes(2)
    };

    this.resetBufferState();
}

MIDIParser.prototype.callParse = function() {
    this.getHeaderAndVerify();
    this.parseFunc(this.buffer);
};

MIDIParser.prototype.parse = function(func) {
    this.parseFunc = func;
    window.addEventListener('data-loaded', this.callParse.bind(this));
};

MIDIParser.prototype.loadData = function(url) {
    var midiRequest = new XMLHttpRequest();
    midiRequest.open('GET', url, true);
    midiRequest.responseType = 'arraybuffer';

    midiRequest.onload = function() {
        var data = midiRequest.response;
        if (data) {
            this.buffer = [].slice.call(new Uint8Array(data));
            this.state_buffer = this.buffer.slice();
            window.dispatchEvent(new Event('data-loaded'));
        }
    }.bind(this);
    midiRequest.send(null);
};

window.onload = function() {
    var p = new MIDIParser();
    p.loadData('/midi/bach_bourree.mid');
    p.parse(function(buffer) {

    });
}
