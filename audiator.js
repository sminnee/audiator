$(document).ready(function() {
	
	var volume = 0;
	var mute = 1;
	
	$('div.slider')
		.slider()
		.bind( "slide", function(event, ui) {
			volume = ui.value / 100;
		});
	
    // Create a new audio element
    var audioOutput = new Audio();
    // Set up audio element with 2 channel, 44.1KHz audio stream.
    audioOutput.mozSetup(1, 44100);

	var totalSent = 0;
	
	var suckSoundTimeout = null;
	
	
	var bpm = 140;
	var audioInterval = 1000 * 60/bpm;
	
//	var audioInterval = 100;
	var sampleSize = audioInterval/1000.0 * 44100;
	var bufferSize = sampleSize * 2;
	
    function suckSound() {
		var totalRead = audioOutput.mozCurrentSampleOffset();
		
		if(totalSent - totalRead  < bufferSize) {
    		var samples = mute ? silence(sampleSize) : sawtooth(sampleSize, 440, volume, 0.9999);
        	audioOutput.mozWriteAudio(samples);
			totalSent += samples.length;
		}
    }
	setInterval(suckSound, audioInterval);

	$('#stop').click(function() {
		mute = 1;
		return false;
	})
	$('#start').click(function() {
		mute = 0;
		return false;
	})
    
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
});