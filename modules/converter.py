import asyncio
from ffmpeg_asyncio import FFmpeg, Progress
from flask import current_app

def convert(inputfilename, outputfilename):
    return asyncio.run(_run_ffmpeg(inputfilename, outputfilename))
        
async def _run_ffmpeg(inputfilename, outputfilename):
    errors = []
    ffmpeg = (
        FFmpeg()
        .input(inputfilename)
        .output(outputfilename)
        .option(key='y')
        .option(key='loglevel', value='warning')
    )

    @ffmpeg.on("start")
    def on_start(arguments: list):
        current_app.logger.debug(f'started with arguments: {arguments}')    

    @ffmpeg.on("progress")
    def on_progress(progress: Progress):
        current_app.logger.debug(progress)

    @ffmpeg.on("completed")
    def on_completed():
        current_app.logger.debug("Finished!")

    @ffmpeg.on("terminated")
    def on_exited(return_code: int):
        current_app.logger.error(f"exited {return_code}")

    @ffmpeg.on("stderr")
    def on_error(line: str):
        current_app.logger.error(f"conversion error: {line}")
        errors.append(line)

    await ffmpeg.execute()   #await pauses the execution of the function until it returns something, without blocking other async functions from running

    if len(errors) > 0:
        return 1
    return ffmpeg._process.returncode   #this cannot be trusted, even with errors it returns 0

