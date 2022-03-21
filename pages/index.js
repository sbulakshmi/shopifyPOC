import { Heading, Page, TextField, Card, Button } from "@shopify/polaris";
import React from "react";



function Index(props) {
  let state = { carrierList: [] };

  async function getCarrierServices() {
    const res = await props.axios_instance.get("/carrier_services");
    debugger;
    state.carrierList = res.data.body.carrier_services;
    //this.setState({ carrierList: res.data.body.carrier_services })
    return res;
  }

  async function handleClick() {
    const result = await getCarrierServices();
    console.log(result);
  }

  // const curCarrier = JSON.stringify(
  //   {
  //     "carrier_services": [
  //       {
  //         "id": 62073372884,
  //         "name": "TransVirtual",
  //         "active": true,
  //         "service_discovery": true,
  //         "carrier_service_type": "api",
  //         "admin_graphql_api_id": "gid://shopify/DeliveryCarrierService/62073372884",
  //         "format": "json",
  //         "callback_url": "https://webhook.site/340813e9-70b6-444d-a909-9a516d63a6a5"
  //       }
  //     ]
  //   }
  // )

  async function delCarrierServices() {
    debugger;
    let { carrierList } = state;
    await props.axios_instance.delete("/carrier_services.json", carrierList
    )
      .then((response) => {
        console.log(response);
      }, (error) => {
        console.log(error);
      });

    //return res;
  }
  async function handleDelCarrier() {
    const result = await delCarrierServices();
    console.log(result);
  }
  const newCarrier = JSON.stringify(
    {
      carrier_service: {
        name: 'TransVirtual1',
        callback_url: 'https://transvirtual170322.free.beeceptor.com',
        service_discovery: true
      }
    }
  )

  async function postCarrierServices() {
    //const res = await props.axios_instance.post("/carrier_services", newCarrier,);

    //{ "metafield": { "namespace": "shop", "key": "discount", "value": "30%", "value_type": "string" } },
    await props.axios_instance.post("/carrier_services.json", newCarrier
    )
      .then((response) => {
        console.log(response);
      }, (error) => {
        console.log(error);
      });

    //return res;
  }
  async function handleNewCarrier() {
    const result = await postCarrierServices();
    console.log(result);
  }
  return (
    <Card title="Transvirtual Shipping Service" sectioned
    >
      <p> Transvirtual provides real-time shipping rates to Shopify. Using our resource, you can add us as a carrier service to your shop and then provide our applicable shipping rates at checkout.</p>
      <Button onClick={handleNewCarrier} type="submit">Install Transvirtual Carrier</Button>
      <Button onClick={handleClick}>Get Carrier</Button>
      <Button onClick={handleDelCarrier}>Delete Transvirtual Carrier</Button>
    </Card>
    // <Page>
    //   <Heading>Carrier Service App </Heading>
    //   <input
    //     value="Install"
    //     type="submit"
    //     onClick={handleClick}
    //   ></input>
    // </Page>
  );

}
export default Index;