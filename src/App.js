import React, { Component } from 'react';
import './App.css';
import ShoutList from "./components/ShoutList";
import Grid from "@material-ui/core/Grid";
import {ZOOM_DEFAULT, GOOGLE_MAP_URL, ZOOM_MAX} from "./constants";
import { Progress } from 'react-sweet-progress';
import "react-sweet-progress/lib/style.css";


const { compose, withProps, withState, withHandlers } = require("recompose");
const {
    withScriptjs,
    withGoogleMap,
    GoogleMap,
    Marker,
    InfoWindow,
    Circle
} = require("react-google-maps");

const MapWithControlledZoom = compose(
    withProps({
        googleMapURL: GOOGLE_MAP_URL,
        loadingElement: <div style={{ height: `100%` }} />,
        containerElement: <div style={{ height: `800px` }} />,
        mapElement: <div style={{ height: `100%` }} />,
    }),
    withState('zoom', 'onZoomChange', ZOOM_DEFAULT),
    withState('center', 'onCenterChange', [0,0]),
    withHandlers(() => {
        let map;

        return {
            onMapMounted: () => ref => {
                map = ref
            },
            onZoomChanged: ({ onZoomChange }) => () => {

                    return onZoomChange(map.getZoom())    ;
              },
            onCenterChanged: ({onCenterChange}) => () => {
                return  onCenterChange([map.getCenter().lat(), map.getCenter().lng()]);
            }
        }
    }),
    withScriptjs,
    withGoogleMap
)(props =>

    <GoogleMap
        options = {{minZoom: ZOOM_MAX, maxZoom: ZOOM_DEFAULT}}
        center={props.myUserLocation}
        zoom={props.zoomLevel}
        ref={props.onMapMounted}
        onZoomChanged={props.onZoomChanged}
        onCenterChanged={props.onCenterChanged}

    >

        {props.onCenterHandle(props.center)}
        {props.onZoomHandle(props.zoom)}


        <Circle
            center={props.myUserLocation}
            //onCenterChanged={props.onCenterChanged}
            radius={10000}
        />

        <Marker
            position={{ lat: props.myUserLocation.lat, lng: props.myUserLocation.lng }}
            options={{icon: process.env.PUBLIC_URL + '/HomeFlag.png'}}
        >

            <InfoWindow >
                <div>
                    You!
                </div>
            </InfoWindow>

        </Marker>

        {props.markers.map(marker => {
            const onClick = props.onMarkerClick.bind(this, marker)
            const infoClick = props.handleMarkerToggle.bind(this)

            if(props.shoutSelected !== null && props.shoutSelected === marker['_links']['self']['href'].substr(marker['_links']['self']['href'].lastIndexOf('/')+1)){

                return (

                    <Marker
                        key={marker.id}
                        onClick={onClick}
                        onMouseOver={onClick}
                        onMouseOut={infoClick}
                        position={{ lat: marker.shoutLat, lng: marker.shoutLong }}
                        options={{icon: process.env.PUBLIC_URL + '/SelectedFlag.png'}}

                    >
                        {props.onOpenHandle &&
                        <InfoWindow onCloseClick={infoClick}>
                            <div>
                                <img  src={"data:image/png;base64,"+marker.shoutImage} />
                                <br/>
                                {marker.shoutEntry}

                            </div>
                        </InfoWindow>}

                    </Marker>
                )
            }else{

            return (

                <Marker
                    key={marker.id}
                    onClick={onClick}
                    onMouseOver={onClick}
                    onMouseOut={infoClick}
                    position={{ lat: marker.shoutLat, lng: marker.shoutLong }}
                    options={{icon: process.env.PUBLIC_URL + '/Pin.png'}}

                >
                    {props.onOpenHandle && props.selectedMarker === marker &&
                    <InfoWindow onCloseClick={infoClick}>
                        <div>
                            <img  src={"data:image/png;base64,"+marker.shoutImage} />
                            <br/>
                            {marker.shoutEntry}
                        </div>
                    </InfoWindow>}

                </Marker>
            )
            }})}

    </GoogleMap>
);


class App extends Component {
    constructor(props) {
        super(props);
        this.handleCenter = this.handleCenter.bind(this);
        this.state = { userLocation: { lat: 32, lng: 32 },
            mapShouts: [],
            loading: true,
            selectedMarker: false,
            zoomLevel: ZOOM_DEFAULT,
            myCenter: [0,0],
            selected: null,
            selectedFromTable: null,
            isOpen: false,
            progressBarStatus: 0
            };


    }

    static defaultProps = {
        center: {
            lat: 59.95,
            lng: 30.33
        },
        zoom: 11
    };


    handleToggle = (event) => {
        this.setState(prevState =>({
            isOpen: !prevState.isOpen
        }));

    }

    handleClick = (marker, event) => {
        this.setState(prevState =>({
            isOpen: !prevState.isOpen
        }));
        this.setState({ selectedMarker: marker });
        this.setState({selected: marker['_links']['self']['href'].substr(marker['_links']['self']['href'].lastIndexOf('/')+1)});
        this.setState({selectedFromTable: this.state.selectedMarker['_links']['self']['href'].substr(this.state.selectedMarker['_links']['self']['href'].lastIndexOf('/')+1)});
    }

    handleZoom = (theZoom, event) => {
        this.setState({ zoomLevel: theZoom });
    }

    handleCenter = (theCenter, event) => {
        this.setState({ myCenter: theCenter });
    }

    componentDidMount() {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;

                this.setState({
                    userLocation: { lat: latitude, lng: longitude },
                    loading: false
                });
            },
            () => {
                this.setState({ loading: false });
            }
        );



    }


    //Get list of shouts from Shout List
    myShoutCallback = (callbackshouts) => {
        this.setState({
            mapShouts: callbackshouts,
        });
    }

    //Call back to get if a row is double clicked
    myShoutCallBackForSelected = (callBackShoutSelected) => {
        this.setState({
            selected: callBackShoutSelected, //What was selected from table - index id only
            selectedFromTable: null, //What was selected from map - index id only
            selectedMarker: null, //What was selected on map - complete object
            isOpen: true //Toggle for picture pop up
        });
    }

    //Call back to reset map center to user location & reset zoom
    resetMapCenterCallBack = (mapResetUserLocation) => {

       this.setState({userLocation: { lat: mapResetUserLocation['lat'], lng: mapResetUserLocation['lng'] }});
        this.setState({ zoomLevel: ZOOM_DEFAULT });
        this.setState({
            selected: null, //What was selected from table - index id only
            selectedFromTable: null, //What was selected from map - index id only
            selectedMarker: null, //What was selected on map - complete object
            isOpen: true //Toggle for picture pop up
        });

    }

    //Call back to update Progress Bar
    updateProgressBarStatusCallBack = (statusBarUpdate) => {
        this.setState({progressBarStatus: statusBarUpdate})
    }

  render() {

      const { loading, userLocation } = this.state;

       if (loading) {
          return null;
      }

    return (
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">Day Shout</h1>
          </header>
            <Grid
                container


            >

                <Grid item xs={12} sm={5}  >
                    <Progress
                        theme={{
                            success: {
                                symbol: '🏄',//🏄
                                color: '#181899'
                            },
                            active: {
                                symbol: '',//🔥
                                color: '#fbc630'
                            },
                            default: {
                                symbol: '',//😀   😱
                                color: '#fbc630'
                            }
                        }}
                        percent={this.state.progressBarStatus}
                         />
                    <ShoutList myUserLocation = {userLocation}
                               theMapCenter = {this.state.myCenter}
                               callbackFromParent={this.myShoutCallback}
                               callbackFromParentForSelected={this.myShoutCallBackForSelected}
                               myZoom = {this.state.zoomLevel}
                               myselectedFromTable = {this.state.selectedFromTable}
                               myResetMapLocationCallBack = {this.resetMapCenterCallBack}
                               myUpdateProgressBarStatusCallBack = {this.updateProgressBarStatusCallBack}
                    />
                </Grid>

                <Grid item xs={12} sm={7} >


                    <MapWithControlledZoom myUserLocation = {userLocation}
                                           markers = {this.state.mapShouts}
                                           onMarkerClick={this.handleClick}
                                           selectedMarker={this.state.selectedMarker}
                                           shoutSelected={this.state.selected}
                                           zoomLevel = {this.state.zoomLevel}
                                           onZoomHandle = {this.handleZoom}
                                           onCenterHandle = {this.handleCenter}
                                           onOpenHandle = {this.state.isOpen}
                                           handleMarkerToggle = {this.handleToggle}/>





                </Grid>

          </Grid>

            <footer className='App-footer'>
                &copy; {new Date().getFullYear()} Copyright: <a href="https://bwizlabs.net/"> Bwiz Labs </a>
            </footer>
        </div>
    );
  }
}

export default App
