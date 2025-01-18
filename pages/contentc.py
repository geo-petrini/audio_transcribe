from nicegui import ui
from nicegui.events import ValueChangeEventArguments


class ContentC():

    def __init__(self):
        ui.button('Button', on_click=self.button_click)
        with ui.row():
            ui.checkbox('Checkbox', on_change=self.show)
            ui.switch('Switch', on_change=self.show)
        ui.radio(['A', 'B', 'C'], value='A', on_change=self.show).props('inline')
        with ui.row():
            ui.input('Text input', on_change=self.show)
            ui.select(['One', 'Two'], value='One', on_change=self.show)
        ui.link('And many more...', '/documentation').classes('mt-8')

    def button_click(self):
        ui.notify('Click')


    def show(self, event: ValueChangeEventArguments):
        name = type(event.sender).__name__
        ui.notify(f'{name}: {event.value}')