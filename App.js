import React, { useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { BottomNavigation, List } from 'react-native-paper';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import data from "./automaatit.json"

export default function App() {

  const [scanned, setScanned] = useState(null);
  const [kuvaustila, setKuvaustila] = useState(false);
  const [lahinSijainti, setLahinSijainti] = useState();


  const QrRoute = () => <>
                          {(kuvaustila)
                          ? <View style={styles.view}>
                              <BarCodeScanner
                              onBarCodeScanned={scanned ? undefined : skannaaKoodi}
                              style={StyleSheet.absoluteFillObject}
                              />
                              <Button title={'Skannaa QR-koodi'} onPress={() => setScanned(false)} />
                            </View>
                          : (scanned)
                            ?<>
                              <WebView source={{ uri: scanned }} style={{ marginTop: 20 }}/>
                              <Button title={'Sulje näkymä'} onPress={() => setScanned(null)} />
                            </>
                            : <View style={styles.view}>
                               <Button title={'Avaa QR-koodin lukija'} onPress={() => kaynnistaKamera()} />
                              </View>
                            }
                        </>

  const OttoRoute = () => <>
                            {(lahinSijainti)
                            ?<>
                                <View style={styles.view_1}> 
                                  <List.Section>
                                    <List.Subheader style={{fontSize:20}}>Lähin Otto-automaatti</List.Subheader>
                                    <List.Item title={`${lahinSijainti[0]} km`} description="Etäisyys"/>
                                    <List.Item title={lahinSijainti[1]} description="Katuosoite"/>
                                    {(lahinSijainti[2].length===2)
                                    ? <List.Item title={`${lahinSijainti[2]} 000${lahinSijainti[3]}`} description="Postinumero ja paikkakunta"/>
                                    :(lahinSijainti[2].length===3)
                                      ? <List.Item title={`${lahinSijainti[2]} 00${lahinSijainti[3]}`} description="Postinumero ja paikkakunta"/>
                                      : (lahinSijainti[2].length===4)
                                      ? <List.Item title={`${lahinSijainti[2]} 0${lahinSijainti[3]}`} description="Postinumero ja paikkakunta"/>
                                      : <List.Item title={`${lahinSijainti[2]} ${lahinSijainti[3]}`} description="Postinumero ja paikkakunta"/>
                                    }
                                  </List.Section>
                                </View>
                                <Button title={'Etsi lähin Otto-automaatti'} onPress={() => kaynnistaSijainti()} />
                              </>
                            : <View style={styles.view}>
                                <Button title={'Etsi lähin Otto-automaatti'} onPress={() => kaynnistaSijainti()} />
                              </View>

                            }
                          </>

  const kaynnistaSijainti = async () => {

    let {status} = await Location.requestPermissionsAsync();

    if (status !== "granted") {
      alert("Sijainti ei saatavilla");
    }

    let location = await Location.getCurrentPositionAsync({});
    setLahinSijainti(laskeSijainti(location.coords.latitude, location.coords.longitude))

  }                       

  const laskeSijainti = (lat, lon) => {

    let etaisyys = [];
    let sijaintiArray = []
    let p = Math.PI/180
    let a, dLon, dLat;

    data.map((data) => {

      dLat = (data.koordinaatti_LAT - lat)*p
      dLon = (data.koordinaatti_LON - lon)*p
      a = Math.sin(dLat/2)*Math.sin(dLat/2)+
          Math.cos(lat*p)*Math.cos(data.koordinaatti_LAT*p)*
          Math.sin(dLon/2)*Math.sin(dLon/2)

      etaisyys.push({etaisyys : 6371 *(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))), katuosoite : data.katuosoite, postinumero : data.postinumero, postitoimipaikka : data.postitoimipaikka})

    })
  
    let min = Math.min.apply(null, etaisyys.map(function(sijainti) {
      return sijainti.etaisyys
    }))

    etaisyys.map((etaisyys) => {

        if(etaisyys.etaisyys === min){
          sijaintiArray.push(etaisyys.etaisyys.toFixed(2))
          sijaintiArray.push(etaisyys.katuosoite)
          sijaintiArray.push(etaisyys.postinumero)
          sijaintiArray.push(etaisyys.postitoimipaikka)
        }
    })

    return sijaintiArray
  }

  const kaynnistaKamera = async () => {

    let {status} = await Camera.requestPermissionsAsync();

    if (status === "granted") {
      setKuvaustila(true);
    } else {
      alert("Kamera ei saatavilla");
    }

  }

  const skannaaKoodi = ({ data }) => {

     let protocol1 = data.slice(0, 8)
     let protocol2 = data.slice(0, 7)
      setKuvaustila(false);

    if(protocol1 == "https://" || protocol2 == "http://"){
      setScanned(data);
    } else {
      alert(`Virheellinen QR-koodi: ${data}`)
    }
  }

  const Bottomnavi = () => {
    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
      { key: 'qr', title: 'QR-Selain', icon: 'scan-helper' },
      { key: 'otto', title: 'Otto-automaatti', icon: 'bank' },
    ]);
  
    const renderScene = BottomNavigation.SceneMap({
      qr: QrRoute,
      otto: OttoRoute,
    });
  
    return (
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
      />
    );
  };

  return (

      Bottomnavi()

  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',

  },
  view_1: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
