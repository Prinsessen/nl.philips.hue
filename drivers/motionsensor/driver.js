'use strict';

const Driver	= require('../../lib/Driver.js');

String.prototype.getMAC = function() {
	return this.split('-')[0].toLowerCase();
}

class DriverMotionSensor extends Driver {

	constructor() {
		super();

		this._deviceType = 'sensor';
	}

	_syncDevice( device_data ) {
		this.debug('_syncDevice', device_data.id);

		let deviceInstance = this.getDeviceInstance( device_data );
		if( deviceInstance instanceof Error )
			return module.exports.setUnavailable( device_data, __('unreachable') );

		module.exports.setAvailable( device_data );

		module.exports.realtime( device_data, 'alarm_motion', deviceInstance.state.presence );
		module.exports.realtime( device_data, 'measure_battery', deviceInstance.config.sensitivity );

		let bridge = Homey.app.getBridge( device_data.bridge_id );
		if( bridge instanceof Error ) return bridge;

		for( let sensor of bridge.getSensors() ) {

			if( sensor.modelId !== 'SML001' ) continue;

			if( sensor.uniqueId.getMAC() === device_data.id.getMAC() ) {

				if( sensor.type === 'ZLLLightLevel' ) {
					let lightLevel = Math.pow( 10, ( sensor.state.lightLevel - 1 ) / 10000 );
					module.exports.realtime( device_data, 'measure_luminance', lightLevel );
				} else if( sensor.type === 'ZLLTemperature' ) {
					module.exports.realtime( device_data, 'measure_temperature', sensor.state.temperature );
				}

			}

		}

	}

	_onExportsPairListDevices( state, data, callback ) {

		if( !state.bridge )
			return callback( 'invalid_bridge' );

		if( state.bridge instanceof Error )
			return callback( state.bridge );

		let result = [];

		for( let sensor of state.bridge.getSensors() ) {

			if( sensor.modelId !== 'SML001' || sensor.type !== 'ZLLPresence' ) continue;

			let deviceObj = {
				name			: sensor.name,
				data 			: this.getDeviceData( state.bridge, sensor )
			};

			result.push( deviceObj );

		}

		callback( null, result );
	}

	/*
		Flow methods
	*/
	_onFlowTriggerDimmerSwitchButtonPressed( callback, args, state ) {
		callback( null, args.button === state.button );
	}
}

module.exports = new DriverMotionSensor();