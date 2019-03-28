/**
 * DataModel class
 *
 * @author Aaron Ponti
 *
 */


/**
 * Define a model class to access all project related information.
 *
 *  The Project Viewer currently recognizes only the experiment types from the microscopy
 *  and flow core technologies. However, it cannot know in advance which core technologies
 *  are active. For this reason, the web app will silently ignore errors returned from the
 *  server when trying to access experiment types that are not registered.
 *
 */
function DataModel() {

    "use strict";

    // Create a context object to access the context information
    this.context = new openbisWebAppContext();

    // Create an OpenBIS facade to call JSON RPC services
    this.openbisServer = new openbis("/openbis");

    // Reuse the current sessionId that we received in the context for
    // all the facade calls
    this.openbisServer.useSession(this.context.getSessionId());

    // Store the data
    this.data = [];

    // Map of the sample tag references
    this.microscopySampleTagCodeMap = {};
    this.flowAnalysersSampleTagCodeMap = {};
    this.flowSortersSampleTagCodeMap = {};

    // Retrieve all projects
    this.openbisServer.listProjects(function (response) {
        if (response.error) {

            // Make sure that the data property is empty
            DATAMODEL.data = [];

            // Report the error
            if (DATAMODEL.openbisServer.getSession() == null) {
                DATAVIEWER.displayStatus("Your session has expired. Please log in to openBIS and try again.", "error");
            } else {
                DATAVIEWER.displayStatus("Could not retrieve the list of projects!", "error");
            }

        } else {

            // Build the data structure
            DATAMODEL.initDataStructure(response.result);

        }
    });

}

/**
 * Store tags for the passed experiments of given type.
 */
DataModel.prototype.storeSampleTags = function (sampleTags, experiments, experimentType) {

    // If no sample tags, return the empty object and stop here
    if (sampleTags.length === 0) {
        return;
    }

    // Reference to the correct map (per experiment type)
    var sampleTagCodeMap;

    // Filters div
    if (this.isMicroscopyExperiment(experimentType)) {
        sampleTagCodeMap = this.microscopySampleTagCodeMap;
    } else if (this.isFlowAnalyzerExperiment(experimentType)) {
        sampleTagCodeMap = this.flowAnalysersSampleTagCodeMap;
    } else if (this.isFlowSorterExperiment(experimentType)) {
        sampleTagCodeMap = this.flowSortersSampleTagCodeMap;
    } else {
        return;
    }

    // Process all sample tags
    for (var i = 0; i < sampleTags.length; i++) {

        // If valid sample tag, store it and return it
        if (sampleTags[i]['@type'] &&
            sampleTags[i]['@type'].localeCompare("Sample") === 0 &&
            sampleTags[i]['sampleTypeCode'] &&
            sampleTags[i]['sampleTypeCode'].localeCompare("ORGANIZATION_UNIT") === 0) {

            // Store the sample tag for future lookup
            sampleTagCodeMap[sampleTags[i]['code']] = sampleTags[i];
        }
    }
};

/**
 * Initialize the data structure with space and project information and
 * display it using the DataViewer.
 * @param projects array of projects.
 */
DataModel.prototype.initDataStructure = function (projects) {

    // Go over all projects and rearrange them per space
    for (var i = 0; i < projects.length; i++) {

        // Get the space code
        var spaceCode = projects[i].spaceCode;

        // Is the space already in the data array?
        if (!DATAMODEL.data.hasOwnProperty(spaceCode)) {
            DATAMODEL.data[spaceCode] = [];
        }

        // Add the project object. We will populate it later on
        // demand with experiment information.
        var project = {};
        project['project'] = projects[i];
        DATAMODEL.data[spaceCode].push(project);
    }

    // Now display the data
    DATAVIEWER.displayProjects(DATAMODEL.data);

};

/**
 * Retrieve experiment info for given project.
 * @param project object.
 */
DataModel.prototype.retrieveExperimentDataForProject = function (project) {

    // Make sure there are no experiments yet
    project['experiments'] = {};

    // Clean the UI
    DATAVIEWER.cleanExperiments();

    // We now retrieve the experiments of all supported types in parallel.
    this.openbisServer.listExperiments([project["project"]],
        "COLLECTION", function (response) {

            if (response.error) {
                // The experiment type COLLECTION is not registered.
                // We ignore it.
            } else {

                // Process all experiments in the collection in parallel
                for (var i = 0; i < response.result.length; i++) {

                    // Get current experiment
                    var experiment = response.result[i];

                    // Process them further by type
                    switch (experiment.code) {

                        case "MICROSCOPY_EXPERIMENTS_COLLECTION":

                            // Retrieve the MICROSCOPY_EXPERIMENT information for current project
                            DATAMODEL.getSamplesOfType("MICROSCOPY_EXPERIMENT", experiment.permId,
                                function (response) {

                                    if (response.error) {
                                        // The experiment type MICROSCOPY_EXPERIMENT is not registered.
                                        // We ignore it.
                                    } else {

                                        project["experiments"]["MICROSCOPY"] = response.result;
                                        DATAVIEWER.displayExperiments(project, "MICROSCOPY");

                                    }
                                });

                            break;

                        case "FLOW_CYTOMETRY_EXPERIMENTS_COLLECTION":

                            // TEMP
                            project["experiments"]["LSR_FORTESSA"] = null;
                            project["experiments"]["FACS_ARIA"] = null;
                            project["experiments"]["INFLUX"] = null;
                            project["experiments"]["S3E"] = null;
                            project["experiments"]["MOFLO_XDP"] = null;

                            // Break down by type
                            /*
                                            // Get all sampes {...}_EXPERIMENT for current collection

                // Retrieve the LSR_FORTESSA_EXPERIMENT information for current project
                DATAMODEL.getSamplesOfType("LSR_FORTESSA_EXPERIMENT", response.result[0].code,
                    function (response) {

                        if (response.error) {
                            // The experiment type LSR_FORTESSA_EXPERIMENT is not registered.
                            // We ignore it.
                        } else {

                            project["experiments"]["LSR_FORTESSA"] = response.result;
                            DATAVIEWER.displayExperiments(project, "LSR_FORTESSA");

                        }
                    });

                // Retrieve the FACS_ARIA_EXPERIMENT information for current project
                DATAMODEL.getSamplesOfType("FACS_ARIA_EXPERIMENT", response.result[0].code,
                    function (response) {

                        if (response.error) {
                            // The experiment type FACS_ARIA_EXPERIMENT is not registered.
                            // We ignore it.
                        } else {

                            project["experiments"]["FACS_ARIA"] = response.result;
                            DATAVIEWER.displayExperiments(project, "FACS_ARIA");

                        }
                    });

                // Retrieve the INFLUX_EXPERIMENT information for current project
                DATAMODEL.getSamplesOfType("INFLUX_EXPERIMENT", response.result[0].code,
                    function (response) {

                        if (response.error) {
                            // The experiment type INFLUX_EXPERIMENT is not registered.
                            // We ignore it.
                        } else {

                            project["experiments"]["INFLUX"] = response.result;
                            DATAVIEWER.displayExperiments(project, "INFLUX");

                        }
                    });

                // Retrieve the S3E_EXPERIMENT information for current project
                DATAMODEL.getSamplesOfType("S3E_EXPERIMENT", response.result[0].code,
                    function (response) {

                        if (response.error) {
                            // The experiment type INFLUX_EXPERIMENT is not registered.
                            // We ignore it.
                        } else {

                            project["experiments"]["S3E"] = response.result;
                            DATAVIEWER.displayExperiments(project, "S3E");

                        }
                    });

                // Retrieve the S3E_EXPERIMENT information for current project
                DATAMODEL.getSamplesOfType("MOFLO_XDP_EXPERIMENT", response.result[0].code,
                    function (response) {

                        if (response.error) {
                            // The experiment type INFLUX_EXPERIMENT is not registered.
                            // We ignore it.
                        } else {

                            project["experiments"]["MOFLO_XDP"] = response.result;
                            DATAVIEWER.displayExperiments(project, "MOFLO_XDP");

                        }
                    });

                             */
                            break;

                        case "ORGANIZATION_UNITS_COLLECTION":
                        // For the time being, we ignore these experiments
                    }

                }
            }
        });
};

/**
 * Checks whether the experiment type is valid and recognized by the app.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is valid and recognized by the app, false otherwise.
 */
DataModel.prototype.isValidExperiment = function (experimentType) {

    return (experimentType === "LSR_FORTESSA" || experimentType === "FACS_ARIA" ||
        experimentType === "INFLUX" || experimentType === "MICROSCOPY" ||
        experimentType === "S3E" || experimentType === "MOFLO_XDP")
};

/**
 * Checks whether the experiment type is a flow cytometry experiment.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is a flow cytometry experiment.
 */
DataModel.prototype.isFlowExperiment = function (experimentType) {

    return (experimentType === "LSR_FORTESSA" || experimentType === "FACS_ARIA" ||
        experimentType === "INFLUX" || experimentType === "S3E" || experimentType === "MOFLO_XDP");

};

/**
 * Checks whether the experiment type is a microscopy experiment.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is a microscopy experiment.
 */
DataModel.prototype.isMicroscopyExperiment = function (experimentType) {

    return (experimentType === "MICROSCOPY");
};

/**
 * Checks whether the experiment type is a flow cytometry experiment for the analyzer class.
 * @param experimentType experiment type
 * @return boolean true if the experiment type is a flow cytometry experiment for the analyzer class.
 */
DataModel.prototype.isFlowAnalyzerExperiment = function (experimentType) {

    return (experimentType === "LSR_FORTESSA");
};

/**
 * Checks whether the experiment type is a flow cytometry experiment for the cell sorter class.
 * @param experimentType experiment type
 */
DataModel.prototype.isFlowSorterExperiment = function (experimentType) {

    return (experimentType === "FACS_ARIA" || experimentType === "INFLUX" ||
        experimentType === "S3E" || experimentType === "MOFLO_XDP");
};

/**
 * Retrieve samples of requested type belonging to specified experiment.
 * @param {String} type
 * @param {String} experiment permID
 * @param {Function} action Callback
 * @returns {Array} List of samples of requested type belonging to the specified experiment.
 */
DataModel.prototype.getSamplesOfType = function (type, expID, action) {

    // Experiment criteria
    var experimentCriteria = new SearchCriteria();
    experimentCriteria.addMatchClause(
        SearchCriteriaMatchClause.createAttributeMatch("PERM_ID", expID)
    );
    experimentCriteria.addMatchClause(
        SearchCriteriaMatchClause.createAttributeMatch("TYPE", "COLLECTION")
    );

    // Sample (type) criteria
    var sampleCriteria = new SearchCriteria();
    sampleCriteria.addMatchClause(
        SearchCriteriaMatchClause.createAttributeMatch("TYPE", type)
    );
    sampleCriteria.addSubCriteria(
        SearchSubCriteria.createExperimentCriteria(experimentCriteria)
    );

    // Search
    this.openbisServer.searchForSamplesWithFetchOptions(sampleCriteria,
        ["PARENTS", "PROPERTIES"], action);

};