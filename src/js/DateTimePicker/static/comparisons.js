/**
 * DateTimePicker (Static) Comparisons
 */

Object.assign(DateTimePicker, {

    /**
     * Test if a date is after another date (day).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    _isAfterDay(a, b) {
        return this._isAfterMonth(a, b) || (this._isSameMonth(a, b) && a.getDate() > b.getDate());
    },

    /**
     * Test if a date is after another date (month).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    _isAfterMonth(a, b) {
        return this._isAfterYear(a, b) || (this._isSameYear(a, b) && a.getMonth() > b.getMonth());
    },

    /**
     * Test if a date is after another date (second).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    _isAfterSecond(a, b) {
        return a.getTimestamp() > b.getTimestamp();
    },

    /**
     * Test if a date is after another date (year).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is after the other date, otherwise FALSE.
     */
    _isAfterYear(a, b) {
        return a.getYear() > b.getYear();
    },

    /**
     * Test if a date is before another date (day).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    _isBeforeDay(a, b) {
        return this._isBeforeMonth(a, b) || (this._isSameMonth(a, b) && a.getDate() < b.getDate());
    },

    /**
     * Test if a date is before another date (month).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    _isBeforeMonth(a, b) {
        return this._isBeforeYear(a, b) || (this._isSameYear(a, b) && a.getMonth() < b.getMonth());
    },

    /**
     * Test if a date is before another date (second).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    _isBeforeSecond(a, b) {
        return a.getTimestamp() < b.getTimestamp();
    },

    /**
     * Test if a date is before another date (year).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is before the other date, otherwise FALSE.
     */
    _isBeforeYear(a, b) {
        return a.getYear() < b.getYear();
    },

    /**
     * Test if a date is equal to another date (day).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    _isSameDay(a, b) {
        return this._isSameMonth(a, b) && a.getDate() === b.getDate();
    },

    /**
     * Test if a date is equal to another date (month).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    _isSameMonth(a, b) {
        return this._isSameYear(a, b) && a.getMonth() === b.getMonth();
    },

    /**
     * Test if a date is equal to another date (second).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    _isSameSecond(a, b) {
        return a.getTimestamp() === b.getTimestamp();
    },

    /**
     * Test if a date is equal to another date (year).
     * @param {DateTime} a The date to test.
     * @param {DateTime} b The date to compare against.
     * @returns {Boolean} TRUE if the date is equal to the other date, otherwise FALSE.
     */
    _isSameYear(a, b) {
        return a.getYear() === b.getYear();
    }

});
