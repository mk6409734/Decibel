from playsound import playsound
from google_trans_new import google_translator
from gtts import gTTS
import os
import socketio
import eventlet
import json
import time
from pydub import AudioSegment
import pygame
import requests
import subprocess
import logging
import sys
import pygame._sdl2 as sdl2

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger('siren')

# Constants
BACKEND_SERVER_URL = 'https://cap.decibel.company'
SIREN_ID = 's004'
MAX_INIT_ATTEMPTS = 5
INIT_RETRY_DELAY = 2  # seconds

def initialize_audio():
    """Initialize the audio system with retries and proper device detection."""
    for attempt in range(MAX_INIT_ATTEMPTS):
        try:
            pygame.mixer.quit()  # Ensure clean state
            pygame.mixer.init()
            
            # List available audio devices
            devices = sdl2.audio.get_audio_device_names()
            logger.info(f"Available audio devices: {devices}")
            
            # Try to find USB audio device
            usb_device = None
            for device in devices:
                if 'USB' in device or 'usb' in device:
                    usb_device = device
                    break
            
            # If USB device found, initialize with it, otherwise use default
            if usb_device:
                logger.info(f"Using USB audio device: {usb_device}")
                pygame.mixer.quit()
                pygame.mixer.init(devicename=usb_device)
            else:
                logger.warning("No USB audio device found, using default audio device")
            
            # Test if audio is working - create a simple silent sound
            test_sound = pygame.mixer.Sound(buffer=bytes([0] * 44100))
            test_sound.play(maxtime=1)  # Play for 1ms just to test
            test_sound.stop()
            logger.info("Audio initialization successful")
            return True
            
        except Exception as e:
            logger.error(f"Audio initialization attempt {attempt+1}/{MAX_INIT_ATTEMPTS} failed: {str(e)}")
            time.sleep(INIT_RETRY_DELAY)
    
    logger.critical("Failed to initialize audio after multiple attempts")
    return False

# Initialize HTTP session with retries
http_session = requests.Session()
http_adapter = requests.adapters.HTTPAdapter(max_retries=3)
http_session.mount('https://', http_adapter)
http_session.timeout = (120, 120)  # (connect timeout, read timeout)
sio = socketio.Client(http_session=http_session)

def play_sound_pygame(file_path, frequency: int):
    """Play sound with proper error handling and logging."""
    try:
        if not os.path.exists(file_path):
            logger.error(f"Audio file not found: {file_path}")
            return False
            
        logger.info(f"Loading audio file: {file_path}")
        pygame.mixer.music.load(file_path)
        
        loops = int(frequency) if frequency != -1 else -1
        logger.info(f"Playing audio with {loops} loops")
        pygame.mixer.music.play(loops=loops)
        
        # Wait for playback to complete
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
        
        logger.info("Audio playback completed")
        return True
    except Exception as e:
        logger.error(f"Error playing sound: {str(e)}")
        # Try to reinitialize audio in case of failure
        initialize_audio()
        return False

def stop_sound_pygame():
    """Stop sound with proper error handling."""
    try:
        pygame.mixer.music.stop()
        logger.info("Audio playback stopped")
        return True
    except Exception as e:
        logger.error(f"Error stopping sound: {str(e)}")
        return False

class SirenManager:
    _instance = None
    _is_playing = False
    
    def __init__(self):
        self._audio_thread = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def merge_and_play(self, message_audio_en: str, message_audio_hi: str, alert_audio: str, gap_in_audio: int, frequency: int):
        """Merge and play audio files with proper error handling."""
        try:
            message_en = AudioSegment.from_mp3(message_audio_en)
            message_hi = AudioSegment.from_mp3(message_audio_hi)
            alert = AudioSegment.from_mp3(alert_audio)
            
            seconds_of_silence = AudioSegment.silent(duration=gap_in_audio)
            combined = message_en + message_hi + seconds_of_silence
            
            output_path = "/home/phoenix/siren-code/combined.mp3"
            combined.export(output_path)
            logger.info(f"Combined audio exported to {output_path} with frequency {frequency}")
            
            return play_sound_pygame(output_path, frequency)
        except Exception as e:
            logger.error(f"Error in merge_and_play: {str(e)}")
            return False

    def play_message(self, message: str, alert_type: str, gap_in_audio: int, language: str, frequency: int):
        """Play message with proper error handling."""
        if self._is_playing:
            logger.info("Already playing audio, ignoring new request")
            return False
        
        try:
            self._is_playing = True
            alert_file = f"/home/phoenix/siren-code/{alert_type}-alarm.mp3"
            
            # Verify alert file exists
            if not os.path.exists(alert_file):
                logger.error(f"Alert file not found: {alert_file}")
                self._is_playing = False
                return False
            
            logger.info(f"Emitting siren-ack-on for {SIREN_ID}")
            sio.emit('siren-ack-on', SIREN_ID)
            
            # If no message, just play the alert
            if len(message) < 1:
                logger.info(f"Playing alert only: {alert_file}")
                play_sound_pygame(alert_file, "-1")
                self._is_playing = False
                return True
            
            # Play alert sound
            logger.info(f"Playing alert: {alert_file} with frequency {frequency}")
            play_sound_pygame(alert_file, frequency)
            
            # Generate TTS for English
            logger.info(f"Generating English TTS for message: {message}")
            en_file = "/home/phoenix/siren-code/captured_voice_en.mp3"
            speak = gTTS(text=message, lang='en', slow=False)
            speak.save(en_file)
            
            # Generate TTS for other language (with fallback)
            hi_file = "/home/phoenix/siren-code/captured_voice_hi.mp3"
            try:
                logger.info(f"Translating message to {language}")
                translator = google_translator(url_suffix='in')
                translated_text = translator.translate(message, lang_tgt=language.lower())
                speak = gTTS(text=translated_text, lang=language.lower(), slow=False)
                speak.save(hi_file)
            except Exception as e:
                logger.error(f"Translation failed: {str(e)}, using English as fallback")
                # Use English as fallback
                speak.save(hi_file)
            
            # Merge and play the audio files
            return self.merge_and_play(en_file, hi_file, alert_file, gap_in_audio, frequency)
            
        except Exception as e:
            logger.error(f"Error in play_message: {str(e)}")
            self._is_playing = False
            return False

    def stop_audio(self):
        """Stop audio with proper error handling."""
        stop_sound_pygame()
        logger.info(f"Emitting siren-ack-off for {SIREN_ID}")
        sio.emit('siren-ack-off', SIREN_ID)
        self._is_playing = False

def is_interface_connected(interface, target="8.8.8.8", timeout=5):
    """Check if a network interface is connected."""
    try:
        logger.info(f"Checking connectivity of interface {interface}")
        subprocess.run(
            ["ping", "-I", interface, "c", "1", target],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
        logger.info(f"Interface {interface} is connected")
        return True
    except subprocess.CalledProcessError:
        logger.warning(f"Interface {interface} is not connected")
        return False

# Socket.IO event handlers
@sio.event
def connect():
    logger.info('Connected to the backend server')
    sio.emit('siren-register', SIREN_ID)

@sio.event
def disconnect():
    logger.info('Disconnected from the backend server')

@sio.on('siren-control-siren')
def handle_siren_control(incoming):
    """Handle siren control commands."""
    logger.info(f"Received siren control command: {incoming}")
    
    try:
        data_in = incoming
        action = data_in.get('action')
        siren_id_command = data_in.get('sirenId')
        
        # Check if this command is for this siren
        if siren_id_command != SIREN_ID:
            logger.info(f"Command not for this siren (ID: {SIREN_ID})")
            return
        
        # Extract parameters with defaults
        alert_type = data_in.get('alertType', 'warning')
        gap_in_audio = int(data_in.get('gapAudio', 0))
        language = data_in.get('language', 'hi')
        frequency = data_in.get('frequency', 1)
        conn_type = data_in.get('connType', 'any')
        
        # Check connectivity based on connection type
        conn_ok = True
        if conn_type == "any":
            logger.info("Connection type is 'any', proceeding")
            conn_ok = True
        elif conn_type == "eth":
            conn_ok = is_interface_connected("eth0") or is_interface_connected("wlan0")
        elif conn_type == "cell":
            conn_ok = is_interface_connected("ppp0")
        
        if not conn_ok:
            logger.warning(f"Required connection type {conn_type} not available")
            sio.emit('siren-ack-off', SIREN_ID)
            return
        
        # Process the action
        siren_manager = SirenManager()
        if action == 'on':
            logger.info("Executing 'on' command")
            siren_manager.play_message("", alert_type, gap_in_audio, language, frequency)
        elif action == 'off':
            logger.info("Executing 'off' command")
            siren_manager.stop_audio()
        else:
            logger.info(f"Playing message: {action}")
            siren_manager.play_message(action, alert_type, gap_in_audio, language, frequency)
            
    except Exception as e:
        logger.error(f"Error handling siren control: {str(e)}")

@sio.on('siren-control-multi-siren')
def handle_multi_siren_control(incoming):
    """Handle multi-siren control commands."""
    logger.info(f"Received multi-siren control command: {incoming}")
    
    try:
        data_in = incoming
        action = data_in.get('action')
        siren_ids_command = data_in.get('sirenIds', [])
        
        # Check if this command includes this siren
        if SIREN_ID not in siren_ids_command:
            logger.info(f"Command not for this siren (ID: {SIREN_ID})")
            return
        
        logger.info(f"This siren (ID: {SIREN_ID}) is part of the multi-siren command")
        
        # Extract parameters with defaults
        alert_type = data_in.get('alertType', 'warning')
        gap_in_audio = int(data_in.get('gapAudio', 0))
        language = data_in.get('language', 'hi')
        frequency = data_in.get('frequency', 1)
        
        # Process the action
        siren_manager = SirenManager()
        if action == 'on':
            logger.info("Executing multi-siren 'on' command")
            siren_manager.play_message("", alert_type, gap_in_audio, language, frequency)
        elif action == 'off':
            logger.info("Executing multi-siren 'off' command")
            siren_manager.stop_audio()
        else:
            logger.info(f"Playing multi-siren message: {action}")
            siren_manager.play_message(action, alert_type, gap_in_audio, language, frequency)
            
    except Exception as e:
        logger.error(f"Error handling multi-siren control: {str(e)}")

def wait_for_connection(max_attempts=10, timeout=30):
    """Wait for an active internet connection."""
    attempts = 0
    while attempts < max_attempts:
        try:
            logger.info(f"Checking internet connection (attempt {attempts+1}/{max_attempts})")
            requests.head('https://cap.simplem.in', timeout=60)
            logger.info("Internet connection established")
            return True
        except requests.ConnectionError:
            attempts += 1
            logger.warning(f"Internet connection not available, waiting {timeout} seconds...")
            time.sleep(timeout)
    
    logger.error("Failed to establish internet connection after maximum attempts")
    return False

if __name__ == '__main__':
    try:
        logger.info("Starting siren service")
        
        # Initialize audio system
        audio_ok = initialize_audio()
        if not audio_ok:
            logger.warning("Audio initialization issues detected, but continuing...")
        
        # Wait for internet connection
        if wait_for_connection():
            logger.info(f"Connecting to backend server at {BACKEND_SERVER_URL}")
            sio.connect(BACKEND_SERVER_URL, wait_timeout=120)
            logger.info("Connected and entering event loop")
            sio.wait()
        else:
            logger.critical("Failed to connect to internet, exiting")
            sys.exit(1)
    except Exception as e:
        logger.critical(f"Fatal error in main loop: {str(e)}")
        sys.exit(1)
