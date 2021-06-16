/**
 * DateTimePicker Native
 */

Object.assign(DateTimePicker.prototype, {

    /**
     * Dispose a native DateTimePicker.
     */
    _disposeNative() {
        const id = dom.getAttribute(this._nativeInput, 'id');

        if (id) {
            dom.setAttribute(this._node, id);
        }

        dom.remove(this._nativeInput);
        dom.show(this._node);

        super.dispose();
    },

    /**
     * Attach events for a native DateTimePicker.
     */
    _eventsNative() {
        dom.addEvent(this._nativeInput, 'change', _ => {
            const value = dom.getValue(this._nativeInput);
            const date = value ?
                DateTime.fromFormat(this._nativeFormat, value) :
                null;
            this._setDate(date);
        });
    },

    /**
     * Parse the native type and format.
     */
    _parseNativeType() {
        if (this._hasDate && !this._hasTime) {
            this._nativeType = 'date';
            this._nativeFormat = 'yyyy-MM-dd';
        } else if (this._hasTime && !this._hasDate) {
            this._nativeType = 'time';
            this._nativeFormat = 'HH:mm';
        } else {
            this._nativeType = 'datetime-local';
            this._nativeFormat = 'yyyy-MM-dd\'T\'HH:mm';
        }
    },

    /**
     * Render a native DateTimePicker.
     */
    _renderNative() {
        const attributes = { type: this._nativeType };

        const id = dom.getAttribute(this._node, 'id');

        if (id) {
            attributes.id = id;
            dom.removeAttribute(this._node, 'id');
        }

        if (this._minDate) {
            attributes.min = this._minDate.format(this._nativeFormat);
        }

        if (this._maxDate) {
            attributes.max = this._maxDate.format(this._nativeFormat);
        }

        this._nativeInput = dom.create('input', {
            class: dom.getAttribute(this._node, 'class'),
            attributes
        });

        if (this._date) {
            this._updateNativeDate();
        }

        dom.before(this._node, this._nativeInput);
        dom.hide(this._node);
    },

    /**
     * Update the native date.
     */
    _updateNativeDate() {
        dom.setValue(this._nativeInput, this._date.format(this._nativeFormat));
    }

});
