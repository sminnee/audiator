$(document).ready(function() {
	
	// Initialise the piano roll
	$(scale('c-2', 'c-4').reverse()).each(function(i,note) {
		if(note == 'gap') {
			$('#piano-roll').append('<div class="gap" />');
		} else {
			var cssClass = note.note.replace('#', ' sharp');
			var $newItem = $('<div class="' + cssClass + '"><span class="key">&nbsp;</span></div>');
			$newItem.data('noteStr', note.str);
			$newItem.data('hertz', note.hertz);
			
			for(var i=0;i<16;i++) {
				var $newStep = $('<span class="step step-' + i + '">&nbsp</span>');
				$newStep.data('step', i);
				$newItem.append($newStep);
			}
			
			$('#piano-roll').append($newItem);
		}
	});
	
	$('#piano-roll .step').click(function() {
		if($(this).hasClass('on')) $(this).removeClass('on');
		else $(this).addClass('on');
		
		saveTrack();
	});
	
	// Load a track
	try {
		loadTrack();
	} catch(e) {
		alert("Sorry, can't load your song: " + e);
	}
	
	var volume = 0.5;
	var mute = 1;
	
	$('div.slider')
		.slider({value: 50})
		.bind( "slide", function(event, ui) {
			volume = ui.value / 100;
		});
	
	try {
    	// Create a new audio element
    	var audioOutput = new Audio();
	    // Set up audio element with 2 channel, 44.1KHz audio stream.
	    audioOutput.mozSetup(1, 44100);
	} catch(e) {}

	var totalSent = 0;
	
	var suckSoundTimeout = null;
	
	
	var bpm = 140 * 4; // 2 steps per 140bpm beat
	var audioInterval = 1000 * 60/bpm;
	
//	var audioInterval = 100;
	var sampleSize = audioInterval/1000.0 * 44100;
	var bufferSize = sampleSize * 2;
	
	
	var currentStep = 0;
	
    function suckSound() {
			var totalRead = audioOutput.mozCurrentSampleOffset();
		
			if(totalSent - totalRead  < bufferSize) {
	    		var samples = mute ? silence(sampleSize) : soundForStep(sampleSize, currentStep);
				if(length in samples) audioOutput.mozWriteAudio(samples);
				else console.log('bad samples', samples);
				totalSent += samples.length;
			}

		currentStep = (currentStep + 1) % 16;
    }
	setInterval(suckSound, audioInterval);

	$('#stop').click(function() {
		mute = 1;
		return false;
	})
	$('#start').click(function() {
		mute = 0;
		currentStep = 0;
		return false;
	})

	/**
	 * Get the sound for the current step
	 */
	function soundForStep(sampleSize, step) {
		var notes = notesForStep(step); 
		if(notes && notes.length > 0) {
			var note = notes[0];
			return sawtooth(sampleSize, hertzForNote(note.noteStr), volume, 0.999);
		} else {
			return silence(sampleSize);
		}
	}

});


// 



	function silence(samples) {
		output = [];
		for(var i=0;i<samples;i++) output.push(0);
		return output;
	}

    function sawtooth(samples, frequency, volume, decay) {
        if(this.counter == null) this.counter = 1;

        var wavelength = 44100/frequency; // wavelength in Samples
        var step = 2/wavelength;
        
        var output = [];

        for(var i=0;i<samples;i++) {
            this.counter -= step;
            if(counter <= -1) this.counter=1;
            output.push(this.counter * volume);
			if(decay) volume *= decay
        }
		return output;
    }

/**
 * Save a track via local storage
 */

var currentNotes = [];

function saveTrack() {
	var notes = [];
	$('#piano-roll span.step.on').each(function() {
		notes.push({ step: $(this).data('step'), noteStr: $(this).parent().data('noteStr') });
	});
	
	var track = {
		version : 'v2',
		notes : notes,
	};
	
	currentNotes = notes;

	window.localStorage.setItem('audiator-track', JSON.stringify(track));
}

/**
 * Load a track from local storage
 */
function loadTrack() {
	var storage = window.localStorage.getItem('audiator-track');
	if(storage) {
		var track = JSON.parse(storage);
		if(track.version == 'v2') {
			$(track.notes).each(function(i, note) {
				$("#piano-roll div:data('noteStr=" + note.noteStr +"') span:data('step=" + note.step + "')")
					.click();
			});
			
			currentNotes = track.notes;
		} else {
			throw "Bad version " + track.version;
		}
	}
}

/**
 * Get all the notes for a single step
 */
function notesForStep(step) {
	return $.grep(currentNotes, function (note) { return note.step == step; });
}


/**
 * Pass a note range, for example  scale('c-0', 'c-1') and get a map of note-name -> hertz
 * If includeGaps is true then gap markers will be included
 */
function scale(start, end, includeGaps) {
	// Base notes, including gaps
	var notes = [ 'a', 'a#', 'b', 'gap', 'c', 'c#', 'd', 'd#', 'e', 'gap', 'f', 'f#', 'g', 'g#' ];
	
	if(!start.match(/([a-z]#?)-([0-9])/)) throw "Bad start '" + start + "'";
	var startName = RegExp.$1;
	var startOctave = RegExp.$2;
	if(!end.match(/([a-z]#?)-([0-9])/)) throw "Bad end '" + end + "'";
	var endName = RegExp.$1;
	var endOctave = RegExp.$2;
	
	// Starting note
	var curNote = 0;
	var curNoteStr;
	while(notes[curNote] != startName) curNote++;
	
	var output = [];

	var octave = startOctave;
	while(true) {
		if(notes[curNote] == 'gap') {
			output.push('gap');
		} else {
			curNoteStr = notes[curNote] + '-' + octave;
			output.push( {str : curNoteStr, hertz: hertzForNote(curNoteStr), note: notes[curNote], octave: octave } );
		}
		if(octave >= endOctave && notes[curNote] == endName) break;
		curNote = (curNote + 1) % notes.length;
		if(curNote == 0) octave++;
	}
	
	return output;
	
}



/**
 * Pass a note, eg, 'c#-0' and get the hertz
 */
function hertzForNote(note) {
	// Base notes (octave #3)
	var base = {
		'a' : 440.00, 'a#' : 466.16, 'b' : 493.88, 'c' : 523.25, 'c#' : 554.37, 'd' : 587.33,
		'd#' : 622.25, 'e' : 659.25, 'f' : 698.46, 'f#' : 739.99, 'g' : 783.99, 'g#' : 830.61,
		'a' : 880.00
	};
	
	if(!note.match(/([a-z]#?)-([0-9])/)) throw "Bad note '" + note + "'";
	
	var name = RegExp.$1;
	var octave = parseInt(RegExp.$2);
	
	var multiplier = 1/8; // the multiplier of octave 0
	while(octave-- > 0) multiplier *=2; // find the desired multiplier
	
	return base[name] * multiplier;
}


