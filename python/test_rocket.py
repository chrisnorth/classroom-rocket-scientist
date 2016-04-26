from astropy.table import Table,Column
from numpy import log,sum,zeros,sqrt,nan,pi
from scipy import where
from matplotlib import pyplot as plot

###########################
## Select rocket stages and orbit
###########################
stage1='8m'
stage2='8m'
stage3='7m'
payload='8m'

n_boosters=0

orbit_name = 'GEO'

###########################
## Read in rocket data
###########################
rocketdata={'1':Table.read('../data/stage1.csv',format='ascii.csv'),\
            '2':Table.read('../data/stage2.csv',format='ascii.csv'),\
            '3':Table.read('../data/stage3.csv',format='ascii.csv'),\
            'P':Table.read('../data/payload.csv',format='ascii.csv'),\
            'B':Table.read('../data/boosters.csv',format='ascii.csv')}
rocketdata['P'].remove_column('Max payload mass (kg)')

sizes={'1':stage1,\
        '2':stage2,\
        '3':stage3,\
        'P':payload}
#add stage if using space plane
if sizes['1']=='Space plane':
    sizes['1b']='Space plane (rocket)'

###########################
## Read in orbit data
###########################
orbitdata=Table.read('../data/orbits.csv',format='ascii.csv')
G=6.67e-11 #Gravitational constant
Mearth=6.e24 #Earth mass (kg)
Rearth=6371.e3 #Earth radius (m)
orbitalt=orbitdata['Altitude (km)']*1e3 #now in in m
#calculate orbital speed
orbitdata.add_column(Column(sqrt(G*Mearth/(orbitalt + Rearth)),\
                            name='Orbital Speed (m/s)'))

orbit={'Final':{'Name':orbit_name}}

#calculate whether Hohmann transfer required
if orbit['Final']['Name']!='LEO':
    orbit['Initial']={'Name':'LEO'}
    LEOname='Initial'
    dotransfer=True
else:
    LEOname='Final'
    dotransfer=False

for orb in orbit:
    for row in range(len(orbitdata)):
        if orbitdata['Name'][row]==orbit[orb]['Name']:
            orbit[orb]['Altitude (m)']=orbitdata['Altitude (km)'][row]*1e3
            orbit[orb]['Radius (m)']=orbit[orb]['Altitude (m)'] + Rearth
            orbit[orb]['Orbital Speed (m/s)']=orbitdata['Orbital Speed (m/s)'][row]
            orbit[orb]['Orbital Period (h)']=(2*pi/3600.)*orbit[orb]['Radius (m)']/orbit[orb]['Orbital Speed (m/s)']

orbit['Drag']={'Name':'Atmospheric Drag',\
    'Delta V (m/s)':1300}

if dotransfer:
    #define Hohmann tranfer orbit (from https://en.wikipedia.org/wiki/Hohmann_transfer_orbit)
    orbit['Transfer']={'Name':'%s-%s Transfer'%(orbit['Initial']['Name'],orbit['Final']['Name'])}
    orbit['Initial']['Delta V (m/s)']=orbit['Initial']['Orbital Speed (m/s)']
    GM = G*Mearth
    r1=orbit['Initial']['Radius (m)']
    r2=orbit['Final']['Radius (m)']
    dv1 = sqrt(GM/r1)*(sqrt(2*r2/(r1+r2))-1)
    dv2 = sqrt(GM/r2)*(1-sqrt(2*r1/(r1+r2)))
    orbit['Transfer']['Delta V (m/s)']=dv1 + dv2
    orbit['Final']['Delta V (m/s)']=0
    orbitnames=['Initial','Drag','Transfer','Final']
else:
    orbit['Final']['Delta V (m/s)']=orbit['Final']['Orbital Speed (m/s)']
    orbitnames=['Final','Drag']

totorbitdv=0.
for orb in orbit:
    totorbitdv += orbit[orb]['Delta V (m/s)']
orbit['Total']={'Delta V (m/s)':totorbitdv}

#put in first stage
stage1Found=False
for r in range(len(rocketdata['1'])):
    if rocketdata['1'][r]['Size']==sizes['1']:
        rocket=Table(rocketdata['1'][r])
        stage1Found=True
assert stage1Found,'No first stage found'

if sizes.has_key('1b'):
    for r in range(len(rocketdata['1'])):
        if rocketdata['1'][r]['Size']==sizes['1b']:
            rocket.add_row(rocketdata['1'][r])

#add second stage
for r in range(len(rocketdata['2'])):
    if rocketdata['2'][r]['Size']==sizes['2']:
        rocket.add_row(rocketdata['2'][r])
#add third stage (if applicable)
if sizes.has_key('3'):
    for r in range(len(rocketdata['3'])):
        if rocketdata['3'][r]['Size']==sizes['3']:
            rocket.add_row(rocketdata['3'][r])
#add payload
for r in range(len(rocketdata['P'])):
    if rocketdata['P'][r]['Size']==sizes['P']:
        rocket.add_row(rocketdata['P'][r])

#add boosters
if n_boosters >0:
    rocket[0]['Size']='%s (+ %d boosters)'%(rocket[0]['Size'],n_boosters)
    rocket[0]['Dry Mass (kg)'] += rocketdata['B']['Dry Mass (kg)']*n_boosters
    rocket[0]['Fuel Mass (kg)'] += rocketdata['B']['Fuel Mass (kg)']*n_boosters
    rocket[0]['Specific Impulse (s)'] += rocketdata['B']['Specific Impulse (s)']*n_boosters
    rocket[0]['Thrust (kN)'] += rocketdata['B']['Fuel Mass (kg)']*n_boosters

nstage=len(rocket)

#extract columns
drymass=rocket['Dry Mass (kg)']
fuelmass=rocket['Fuel Mass (kg)']
specim=rocket['Specific Impulse (s)']
thrust=rocket['Thrust (kN)'] * 1e3 #convert from kN to N

specim[where(specim==0)]=-1

#fuel mass flow (thrust specific impulse)
rocket.add_column(Column(thrust/(9.81*specim),name='Mass Flow (kg/s)'))
massflow=rocket['Mass Flow (kg/s)']
# massflow[where(massflow==0)]=-1
#fuel burn time (thrust specific impulse)
rocket.add_column(Column(fuelmass/massflow,name='Burn Time (s)'))
burntime=rocket['Burn Time (s)']

#fuel effective velocity (g * specific impulse)
rocket.add_column(Column(9.81*specim,name='V_eff (m/s)'))

#add additional columns
rocket.add_column(Column(zeros(nstage),name='Initial Mass (kg)'))
rocket.add_column(Column(zeros(nstage),name='Final Mass (kg)'))
rocket.add_column(Column(zeros(nstage),name='Initial V (m/s)'))
rocket.add_column(Column(zeros(nstage),name='Delta V (m/s)'))
rocket.add_column(Column(zeros(nstage),name='Final V (m/s)'))

veff=rocket['V_eff (m/s)']
initvel=rocket['Initial V (m/s)']
initmass=rocket['Initial Mass (kg)']
deltavel=rocket['Delta V (m/s)']
finalvel=rocket['Final V (m/s)']
finalmass=rocket['Final Mass (kg)']


#set initial velocity
vel=0.
for s in range(nstage):
    initvel[s]=vel
    initmass[s] = sum(drymass[s:]) + sum(fuelmass[s:])
    finalmass[s] = sum(drymass[s:]) + sum(fuelmass[s+1:])
    deltavel[s] = veff[s] * log(initmass[s]/finalmass[s])
    finalvel[s]=initvel[s]+deltavel[s]
    vel=finalvel[s]

if rocket['Final V (m/s)'][-1]>=orbit['Total']['Delta V (m/s)']:
    achievedorbit=True
else:
    achievedorbit=False

print 'Rocket:'
for s in range(nstage-1):
    # if rocket['Stage Name'][s]=='None':
    #     continue
    print '%s (%sm):'%(rocket['Stage Name'][s],rocket['Fuselage Diameter/width (m)'][s])
    print '  Impulse: %g s'%(rocket['Specific Impulse (s)'][s])
    print '  Thrust: %g kN'%(rocket['Thrust (kN)'][s])
    print '  Fuel: %g kg'%(rocket['Fuel Mass (kg)'][s])
    print '  Dry mass: %g kg'%(rocket['Dry Mass (kg)'][s])
    print '  Diameter: %g m'%(rocket['Fuselage Diameter/width (m)'][s])
    print '  Height: %g m'%(rocket['Height/length (m)'][s])
    print '  V_eff: %g m/s'%(rocket['V_eff (m/s)'][s])
    print '  Mass flow rate: %g km/s'%(rocket['Mass Flow (kg/s)'][s])
    print '  Burn time: %g s'%(rocket['Burn Time (s)'][s])
    print '  Mass (initial): %g kg'%(rocket['Initial Mass (kg)'][s])
    print '  Mass (final): %g kg'%(rocket['Final Mass (kg)'][s])
    print '  V (initial): %g m/s'%(rocket['Initial V (m/s)'][s])
    print '  Delta-V: %g m/s'%(rocket['Delta V (m/s)'][s])
    print '  V (final): %g m/s'%(rocket['Final V (m/s)'][s])
    # print '%s (%sm): %.2f km/s (%.2f s)'%(rocket['Stage Name'][s],rocket['Fuselage Diameter/width (m)'][s],rocket['Final V (m/s)'][s]/1.e3,rocket['Burn Time (s)'][s])
print '---'
print 'Orbit delta-V:'
for orb in orbitnames:
    print '%s'%(orbit[orb]['Name'])
    if orbit[orb].has_key('Orbital Speed (m/s)'):
        print '  Altitude: %g km'%(orbit[orb]['Altitude (m)']/1.e3)
        print '  Orbital period: %g h'%(orbit[orb]['Orbital Period (h)'])
        print '  Orbital speed: %g m/s'%(orbit[orb]['Orbital Speed (m/s)'])
    print '  Delta-V: %g m/s:'%(orbit[orb]['Delta V (m/s)'])
    # print '%s: %.2f km/s'%(orbit[orb]['Name'],orbit[orb]['Delta V (m/s)']/1.e3)
print 'Total for %s: %.2f km/s'%(orbit['Final']['Name'],orbit['Total']['Delta V (m/s)']/1.e3)
print '---'
if achievedorbit:
    print 'Orbit Achieved'
else:
    print 'WARNING: Orbit NOT Achieved'


