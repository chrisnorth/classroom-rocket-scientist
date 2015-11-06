# Classroom Rocket Scientist

1. Choose a level (beginner: KS2, intermediate: KS2+, advanced: KS3)
2. Design your satellite
	*. Choose type (KS2/KS2+/KS3) - scenario selection
		a *Navigation satellites*: The global positioning system is made up of 24 satellites that orbit at an altitude of 20,000 km above the surface of the Earth. The difference in time for signals received from four satellites is used to calculate the exact location of a GPS receiver on Earth.
			* *Satellite Navigation System*
				* Budget = 100 credits
				* Default size = small
				* Orbit requirement = HEO
				* Instrument requirement = GPS transmitter
				* Instrument requirement = Atomic clock
			* *Map-making satellite*
				* Budget = 200 credits
				* Default size = medium
				* Orbit requirement = LEO
				* Instrument requirement = High-resolution camera
		b *Communication satellites*: These are used for television, phone or internet transmissions, for example, the Optus D1 satellite is in a geostationary orbit above the equator and has a coverage footprint to provide signals to all of Australia and New Zealand.
			* *Satellite telephone system*
				* Budget = 100 credits
				* Default size = cube
				* Instrument requirement = Small radio transmitter
			* *Satellite internet*
				* Budget = 200 credits
				* Default size = medium
				* Instrument requirement = Large radio transmitter
				* Instrument requirement = Internet encoder
			* *Satellite TV*
				* Budget = 500 credits
				* Default size = large
				* Instrument requirement = Large radio receiver
				* Instrument requirement = Large radio transmitter
				* Instrument requirement = TV encoder
		c *Earth Observation satellites*: These are used to image clouds and measure temperature and rainfall. Both geostationary and low Earth orbits are used depending on the type of weather satellite. Weather satellites are used to help with more accurate weather forecasting. These are used to photograph and image the Earth. Low Earth orbits are mainly used so that a more detailed images can be produced.
			* *Weather forecasting*
				* Budget = 200 credits
				* Default size = medium
				* Instrument requirement = Camera
				* Instrument requirement = Large radio transmitter
			* *Vegetation mapping*
				* Budget = 200 credits
				* Default size = medium
				* Instrument requirement = IR camera
				* Instrument requirement = Large radio transmitter
			* *Natural disaster monitoring*
				* Budget = 500 credits
				* Default size = large
				* Orbit requirement = LEO
				* Instrument requirement = High-resolution camera
				* Instrument requirement = Large radio transmitter
			* *Surface mapping*
				* Budget = 500 credits
				* Default size = large
				* Orbit requirement = LEO
				* Instrument requirement = Radar altimeter
				* Instrument requirement = Large radio transmitter

3. Choose size (KS2+/KS3) - Each size has different mass, cost and # instruments
	* KS2: no choice - given by Default size
	* KS2+: S/M/L
	* KS3: nanosat/S/M/L
4. choose orbit (KS3): low-earth orbit, high-earth orbit (HEO) or geostationary
	* KS2: no choice - default to LEO
	* KS2+: no choice - default to LEO
	* KS3: LEO/HEO/GSO
5. Choose Your Instruments
	* Each one has mass and cost, power requirement and takes up an instrument slot
		* Camera: (optical)  
		* Camera: (IR; vegetation)
		* Camera: (FIR; atmosphere) - needs more power/money
		* Spectrometer (Ice)
		* GPS transmitter
		* Atomic clock (for GPS timing)
		* Radio receiver
		* Radio transmitter
		* Mirror/ telescope
		* Camera (KS2)
	* KS2: choose types of instrument
	* KS2+: choose types of instrument considering cost (extended list - __What is on the extended list?__)
	* KS3: choose types of instrument considering cost and mass requirements.
6. Choose Power Source
	* Solar Power - deployed or fixed (power/unit area)
	  * Deployed: set number for KS2 & KS2+, or area for KS3
		* Fixed: set by satellite size
			* KS2: everything has infinite power, and select number
			* KS2+: solar power only, and select number
			* KS3: power sources have cost/size/mass (power output or power/area)
	  *  Batteries & RTG (KS3 only):
			* Radioisotope Thermoelectric Generator (RTG) - constant power output, and takes up an instrument slot
			* Non-rechargable battery - constant power output (limited lifetime), and takes up an instrument slot
5. Design your rocket
	* Main rocket
		* Small/Medium/Large
		* Space Plane (limit on payload size, can’t have boosters, only small upper stage)
	* Boosters (not for space plane)
		* 0,2,4,6
	* Payload Bay (only small for space plane)
		* Small
		* Medium
		* Large
	* Upper stage (only small for space plane. Optional for KS2+ and KS3)
		* Small
		* Medium
		* Large
	* KS2: Choose launch vehicle: rocket or space plane. If rocket, choose size of payload bay, main rocket and boosters.
	* KS2+: Choise launch vehicle based on thrust available.
	* KS3: Choose launch vehicle: rocket or space plane. If rocket, choose size of payload bay, main rocket and boosters. Choose number of boosters Consider cost, size and mass of satellite, orbit and necessary thrust.
6. LAUNCH!

## Conflicts:
* Cannot choose RTG for satellites in LEO (danger of plutonium dropping to Earth)
* Can’t have payload bay larger than main rocket (space plane = small)
* Can’t have upper stage larger than main rocket (space plane = small)
* Power needs cannot exceed power output (KS2: infinite power)
* Instrument number cannot exceed number of instrument slots

## Notes

* http://exploration.grc.nasa.gov/education/rocket/rktwtp.html
* [Document source](https://docs.google.com/document/d/1KMonWavBMR8Y60x_3d2V89WUDXDj9-SpAoQLopCCzwM/edit)
* [Spreadsheet](https://docs.google.com/spreadsheets/d/1kg0A0AkWSoY3SamFWFQeHIjYOla1-1JH3dDfP1nw22k/edit#gid=0)

## Rocket calculations
* Read in data from /data/stage1.csv etc. for appropriate stages
  * Space Plane is split into two (adds "Stage 1b")
* Calculate fuel effective velocity: V_eff [m/s] = g [m/s^2] * SpecificImpulse [s]
* Calulate mass flow rate: MassFlowRate [kg/s] = Thrust [N] /(g [m/s^2] * SpecificImpulse [s])
  * Burn time [s] = Fuel Mass [kg] / MassFlowRate [kg/s]
* delta-V (per stage) [m/s] = V_eff [m/s] * ln(Mass_init/Mass_final) [remembering to include the masses of all the stages and fuel above]
* Calculate orbital speed for LEO
* For higher orbits, assume a Hohmann Transfer orbit (see https://en.wikipedia.org/wiki/Hohmann_transfer_orbit) - two burns required between orbit radii r1 & r2
  * Delta-V 1 = sqrt(G*M_earth/r1) * ( sqrt(2*r2/(r1+r2)) - 1 )
  * Delta-V 2 = sqrt(G*M_earth/r2) * ( 1 - sqrt(2*r1/(r1+r2)) )
* If total delta-V from stages >= total delta-V required, orbit can be achieved