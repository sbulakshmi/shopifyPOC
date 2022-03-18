import { Page } from "@shopify/polaris";
import React from "react";
import { ResourcePicker } from '@shopify/app-bridge-react';

class Index extends React.Component {
  state = { open: false }

  render() {
    return (
      <Page title="Product Selector"
        primaryAction={{ content: 'Select Products', onAction: () => this.setState({ open: true }) }}
      >
        <ResourcePicker
          resourceType="Product"
          open={this.state.open}
          onCancel={() => this.setState({ open: false })}
          onSelection={(resources) => this.handleSelection(resources)} />
      </Page>
    );
  }

  handleSelection = (resources) => {
    const idOfResource = resources.selection.map(product => product.id);
    this.setState({ open: false });
    //console.log(resources);
    console.log(idOfResource);
  }
}
export default Index;