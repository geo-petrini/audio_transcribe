import whisper
from flask import current_app

def init_model():
    current_app.logger.info(f'loading speech to text model: {current_app.config["WISPHER_MODEL"]}')
    current_app.config['stt_model'] = whisper.load_model( current_app.config['WISPHER_MODEL'] )
    current_app.logger.info('model loaded')    


def getModel():
    if not 'stt_model' in current_app.config: init_model()
    return current_app.config['stt_model']
        
        
def transcribe(inputfilename):
    result = getModel().transcribe(inputfilename)
    return result
