'use strict';

console.clear();

function MIDIParser(url) {
    url = url || undefined;
    if(url) this.loadData(url);
}

Array.prototype.popBytes = function(amount, type) {
    type = type || 'integer';

    var bytes;
    switch(type) {
        case 'hex':
            bytes = this.splice(0, amount).map(function(byte) {
                return byte.toString(16);
            }).join('');
        break;
        case 'integer':
            bytes = this.splice(0, amount).map(function(byte) {
                return byte.toString(16);
            }).join('');
            bytes = parseInt(bytes, 16);
        break;
    }

    return bytes;
};

MIDIParser.prototype.popBytes = function(amount, type) {
    return this.stateBuffer.popBytes(amount, type);
};

MIDIParser.prototype.resetBufferState = function() {
    this.stateBuffer = this.buffer.slice();
}

MIDIParser.prototype.verifyHeader = function() {
    var headerStart = this.popBytes(4, 'hex'); // MThd '4d546864'
    if(headerStart !== '4d546864') throw 'Invalid midi file!';

    // Pop the header chunksize off (4 bytes), we know it's 6 bytes always.
    this.popBytes(4);

    this.fileInfo = {
        format: this.popBytes(2),
        trackChunks: this.popBytes(2),
        division: this.popBytes(2)
    };
}

MIDIParser.prototype.getTrackChunks = function() {
    var chunks = [];
    for(var i = 0; i < this.fileInfo.trackChunks; i++) {
        chunks.push(this.getNextTrackChunk());
    }
    return chunks;
}

MIDIParser.prototype.getNextTrackChunk = function() {
    var trackChunkStart = this.popBytes(4, 'hex'); // MTrk '4d54726b'
    if(trackChunkStart !== '4d54726b') throw 'Error parsing broken track chunk...';

    var chunkSize = this.popBytes(4);
    var trackEvents = this.stateBuffer.splice(0, chunkSize);
    var midiEvents = [];

    while(trackEvents.length > 0) {
        var variableLengthValue = trackEvents.popBytes(1);
        if(variableLengthValue >= 128) variableLengthValue |= trackEvents.popBytes(1) << 8;
        var midiEvent = trackEvents.popBytes(1);

        midiEvents.push({
            variableLengthValue: variableLengthValue,
            midiEvent: midiEvent,
            byteTwo: trackEvents.popBytes(1),
            byteThree: trackEvents.popBytes(1)
        });
    }

    return midiEvents;
}

MIDIParser.prototype.callParse = function() {
    this.verifyHeader();
    var chunks = this.getTrackChunks();
    chunks.forEach(function(chunk, index) {
        console.log(chunk);
    });
    this.resetBufferState();
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
            this.stateBuffer = this.buffer.slice();
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
};

// Array.prototype.popBytes = undefined;
