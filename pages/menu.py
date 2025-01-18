from nicegui import ui
from nicegui.events import ValueChangeEventArguments

from modules.local_file_picker import local_file_picker
from pages.contentc import ContentC
from pages.audio_recorder import AudioRecorder


async def pick_file() -> None:
    result = await local_file_picker('~', multiple=True)
    ui.notify(f'You chose {result}')


#header
with ui.header().classes(replace='row items-center') as header:
    ui.button(on_click=lambda: left_drawer.toggle(), icon='menu').props('flat color=white')
    with ui.tabs() as tabs:
        ui.tab('A')
        ui.tab('B')
        ui.tab('C')
        ui.tab('D')
        ui.tab('F')

with ui.footer(value=False) as footer:
    ui.label('Footer')
    ui.label('Created by Geo Petrini, 2025')

with ui.left_drawer().classes('bg-blue-100') as left_drawer:
    ui.label('Side menu')

with ui.page_sticky(position='bottom-right', x_offset=20, y_offset=20):
    ui.button(on_click=footer.toggle, icon='contact_support').props('fab')

with ui.tab_panels(tabs, value='A').classes('w-full'):
    with ui.tab_panel('A'):
        ui.label('Content of A')
        import pages.clock
    with ui.tab_panel('B'):
        ui.label('Content of B')
        ui.button('Choose file', on_click=pick_file, icon='folder')
        ui.upload(on_upload=lambda e: ui.notify(f'Uploaded {e.name}')).classes('max-w-full')
    with ui.tab_panel('C'):
        ui.label('Content of C')
        c = ContentC()
    with ui.tab_panel('D'):
        import pages.tables
    with ui.tab_panel('F'):

        with ui.row().classes('w-full justify-center'):
            audio_recorder = AudioRecorder(on_audio_ready=lambda data: ui.notify(f'Recorded {len(data)} bytes'))

        with ui.row().classes('w-full justify-center'):
            ui.button('Play', on_click=audio_recorder.play_recorded_audio) \
                .bind_enabled_from(audio_recorder, 'recording')
            ui.button('Download', on_click=lambda: ui.download(audio_recorder.recording, 'audio.ogx')) \
                .bind_enabled_from(audio_recorder, 'recording')