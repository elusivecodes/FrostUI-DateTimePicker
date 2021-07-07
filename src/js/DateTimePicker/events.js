// DateTimePicker events
dom.addEvent(document, 'click.ui.datetimepicker', e => {
    const target = UI.getClickTarget(e);
    const menus = dom.find('.datetimepicker:not(.datetimepicker-inline)');

    for (const menu of menus) {
        const trigger = DateTimePicker._triggers.get(menu);

        if (dom.isSame(target, trigger)) {
            continue;
        }

        const datetimepicker = DateTimePicker.init(trigger);
        datetimepicker.hide();
    }
});
