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

MIDIParser.prototype.getHeaderAndVerify = function() {
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

MIDIParser.prototype.getTrackChunk = function() {
    var trackChunkStart = this.popBytes(4, 'hex'); // MTrk '4d54726b'
    if(trackChunkStart !== '4d54726b') throw 'Error parsing broken track chunk...';
    var chunkSize = this.popBytes(4);
    var trackEvents = this.stateBuffer.splice(0, chunkSize);

    var notes = [];

    while(trackEvents.length-1 > 0) {
        var variableLengthValue = trackEvents.popBytes(1);
        if(variableLengthValue >= 128) variableLengthValue |= trackEvents.popBytes(1) << 8;

        var midiEvent = Math.abs(~trackEvents.popBytes(1) >> 1);

        // Is note on/off?
        if(midiEvent >= 0x80 && midiEvent <= 0x9F) {
            var note = {};

            note.channel = (midiEvent - 0x80) + 1;
            note.noteNumber = Math.abs(~trackEvents.popBytes(1) >> 1);
            note.noteVelocity = Math.abs(~trackEvents.popBytes(1) >> 1);

            notes.push(note);
        } else {
            trackEvents.pop(2);
        }
    }

    return notes;
}

MIDIParser.prototype.callParse = function() {
    this.getHeaderAndVerify();
    var notes = this.getTrackChunk();
    while(notes) {
        console.log(notes);
        notes = this.getTrackChunk();
    }
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
