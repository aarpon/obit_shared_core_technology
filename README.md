# openBIS Importer Toolset :: Shared Core Technology

The openBIS Importer toolset is a tightly integrated collection of tools that allows for the semi-automated, semi-unsupervised registration of annotated datasets into openBIS directly from the acquisition stations; but it also extends openBIS itself with custom data viewers and server-side core plug-ins packaged into two new core technologies for flow cytometry and microscopy. To support the flow and microscopy core technology, a common module called **shared core technology** can optionally be added. 

To enable the shared core technology in openBIS, add the following line to ``openbis/servers/core-plugins/core-plugins.properties``:

``enabled-modules = flow, microscopy, shared``

The shared module is only useful in combination with either the [flow core technology](https://github.com/aarpon/obit_flow_core_technology) or the [microscopy core technology](https://github.com/aarpon/obit_microscopy_core_technology) (or, obviously, both).

## User manuals and administration guides

oBIT website: https://wiki-bsse.ethz.ch/display/oBIT
