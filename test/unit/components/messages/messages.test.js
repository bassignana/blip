/* global chai */
/* global describe */
/* global sinon */
/* global it */

var React = require('react');
var expect = chai.expect;

var Messages = require('../../../../app/components/messages/messages');
const { mount } = require('enzyme');

describe('Messages', function () {
  it('should be exposed as a module and be of type function', function() {
    expect(Messages).to.be.a('function');
  });

  describe('render', function() {
    it('should render without problems when required props are present', function () {
      console.error = sinon.stub();
      var props = {
        timePrefs: {}
      };
      var elem = React.createElement(Messages, props);
      var render = mount(elem);
      expect(render).to.be.ok;
      expect(console.error.callCount).to.equal(0);
    });
  });

  describe('initial state', function() {
    it('should equal expected initial state', function() {
      var props = {
        messages : []
      };
      var elem = React.createElement(Messages, props);
      var render = mount(elem);
      var state = render.childAt(0).state();

      expect(state.messages).to.deep.equal(props.messages);
    });
  });
});
