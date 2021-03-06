 Ext.define("cycle-time-summary-app", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),

    defaults: {
        margin: 10,
        labelAlign: 'right'
    },

    instructions: 'Please select the criteria for report and click update to see the report',

    items: [
        {xtype:'container',itemId:'selector_box_parent', layout: 'hbox', items: [
            {xtype:'container',itemId:'selector_box', layout: 'hbox', flex: 1},
            {xtype:'container',itemId:'selector_box_right', layout:'hbox', cls: 'rly-right'}
        ]},
        {xtype:'container',itemId:'filter_box', flex: 1},
        {xtype:'container',itemId:'cycletime_box', flex: 1},
        {xtype: 'container', itemId: 'message_box', flex: 1, height: 45, tpl: '<tpl><div class="no-data-container"><div class="secondary-message">{message}</div></div></tpl>'},
        {xtype:'container',itemId:'grid_box'}
    ],

    integrationHeaders : {
        name : "cycle-time-summary-app"
    },

    config: {
        defaultSettings: {
          //  includeTypes:  ['HierarchicalRequirement','Defect'],
            artifactType: 'User Story & Defect',
            queryFilter: "",
            granularity: 'minute',
            precision: 2,
            exportLimit: 10000
        }
    },
    exportDateFormat: 'm/d/Y h:i:s',
    _gridConfig: {},

    launch: function() {
       this.logger.log('Launch Settings', this.getSettings());
       this.addSelectors()
    },
    showErrorNotification: function(msg){
        if (!msg){
            msg = "Error during execution.  See logs for details."
        }
        Rally.ui.notify.Notifier.showError({message: msg});
    },
    addSelectors: function(){

        this.getSelectorBox().removeAll();
        this.getCycleTimeBox().removeAll();
        this.getFilterBox().removeAll();
        this.getMessageBox().update({message: this.instructions});

        // var fp = this.getSelectorBox().add({
        //     xtype: 'fieldpickerbutton',
        //     modelNames: this.getModelNames(),
        //     context: this.getContext(),
        //     stateful: true,
        //     stateId: 'grid-columns'
        // });
        // fp.on('fieldsupdated', this.updateGridFields, this);

        // var filter = this.getSelectorBox().add({
        //     xtype: 'rallyinlinefilterbutton',
        //     modelNames: this.getModelNames(),
        //     context: this.getContext(),
        //     margin: '3 9 0 0',
        //     stateful: true,
        //     stateId: 'grid-filters-1',
        //     inlineFilterPanelConfig: {
        //         quickFilterPanelConfig: {
        //             addQuickFilterConfig: {
        //                 whiteListFields: ['Milestones', 'Tags']
        //             }
        //         },
        //         advancedFilterPanelConfig: {
        //             advancedFilterRowsConfig: {
        //                 propertyFieldConfig: {
        //                     whiteListFields: ['Milestones', 'Tags']
        //                 }
        //             }
        //         }
        //     },
        //     listeners: {
        //         inlinefilterready: this.addInlineFilterPanel,
        //         inlinefilterchange: this.updateGridFilters,
        //         scope: this
        //     }
        // });

        //this.addCycleTimePanel();

        var ctButton = this.getSelectorBox().add({
            xtype: 'cycletimepickerbutton',
            modelNames: this.getModelNames(),
            context: this.getContext(),
            dateType : this.getSetting('dateType'),
            margin: '3 9 0 0',
            listeners: {
                cycletimepickerready: this.addCycleTimePanel,
                scope: this,
                cycletimeparametersupdated: this.updateCycleTimeParameters
            }
        });

        this.getSelectorBoxRight().removeAll();

        var bt = this.getSelectorBoxRight().add({
            xtype: 'rallybutton',
            itemId: 'btUpdate',
            text: 'Update',
            width: 100,
            margin: '3 9 0 0'
        });
        bt.on('click', this.updateGrid, this);

        this.getSelectorBoxRight().add({
            xtype: 'rallybutton',
            style: {'float': 'right'},
            cls: 'secondary rly-small',
            margin: '3 9 0 0',
            frame: false,
            itemId: 'actions-menu-button',
            iconCls: 'icon-export',
            listeners: {
                click: this._export,
                scope: this
            }
        });

        // this.getSelectorBoxRight().add({
        //     xtype: 'rallybutton',
        //     iconCls: 'icon-help',
        //     cls: 'help-button',
        //     margin: '0 9 0 25',
        //     listeners: {
        //         click: this.showInstructionsDialog,
        //         scope: this
        //     }
        // });
    },

     showInstructionsDialog: function(btn){
         var popoverTarget = btn.getEl();

         this.popover = Ext.create('Rally.ui.popover.Popover', {
             target: popoverTarget,
             placement: ['bottom', 'left', 'top', 'right'],
             cls: 'field-picker-popover',
             toFront: Ext.emptyFn,
             buttonAlign: 'center',
             title: "Cycle Time App Instructions",
             width: Math.min(this.getWidth(),400),
             listeners: {
                 destroy: function () {
                     this.popover = null;
                 },
                 scope: this
             },
             buttons: [
                 {
                     xtype: "rallybutton",
                     text: 'Close',
                     cls: 'field-picker-cancel-btn secondary dark rly-small',
                     listeners: {
                         click: function() {
                             this.popover.close();
                         },
                         scope: this
                     }
                 }
             ],
             items: [
                 {
                     xtype: 'container',
                     html: this.instructions
                 }
             ]
         });
     },
    showExportMenu: function(button){
         var menu = Ext.widget({
             xtype: 'rallymenu',
             items: [
             {
                 text: 'Export Summary...',
                 handler: function(){
                     this.exportData(false,true);
                 },
                 scope: this
             },{
                 text: 'Export with Timestamps...',
                 handler: function(){
                     this.exportData(true,false);
                 },
                 scope: this
             },{
                 text: 'Export Summary and Timestamps...',
                 handler: function(){
                     this.exportData(true, true);
                 },
                 scope: this
             }
            ]
         });
         menu.showBy(button.getEl());
         if(button.toolTip) {
             button.toolTip.hide();
         }
     },
    getSelectorBoxRight: function(){
         return this.down('#selector_box_right');
     },
    getFilterBox: function(){
        return this.down('#filter_box');
    },
    getCycleTimeBox: function(){
        return this.down('#cycletime_box');
    },
    addInlineFilterPanel: function(panel){
        this.logger.log('addInlineFilterPanel', panel);
        this.getFilterBox().add(panel);
    },
    addCycleTimePanel: function(panel){
        this.logger.log('addCycleTimePanel', panel);
        this.getCycleTimeBox().add(panel);
    },
    updateGridFields: function(fields){
        this.logger.log('updateGridFields', fields);
        this._gridConfig.fields = fields;
        this.updateGrid();
    },
     setUpdateButtonUpdateable: function(updateable){
         var button = this.down('#btUpdate');
         if (!button){
             return;
         }

         if (updateable){
             button.setDisabled(false);
             button.setIconCls('icon-refresh');
         } else {
             button.setDisabled(true);
             button.setIconCls('');
         }
     },
    updateGridFilters: function(filter){
        this.logger.log('updateGridFilters', filter.getTypesAndFilters());
        this._gridConfig.filters = filter.getTypesAndFilters();
        this.getSelectorBox().doLayout();
        this.setUpdateButtonUpdateable(true);
    },
    updateCycleTimeParameters: function(parameters){
        this.logger.log('updateCycleTimeParameters',parameters.getCycleTimeParameters());
        this._gridConfig.cycleTimeParameters = parameters.getCycleTimeParameters();
        this.setUpdateButtonUpdateable(true);
    },
     calculateCycleTime: function(){
         return this.down('cycletimepickerbutton') && this.down('cycletimepickerbutton').hasValidCycleTimeParameters() || false;
     },
     getMessageBox: function(){
         return this.down('#message_box');
     },
     updateMessageBox: function(msg, color){

         if (color){
             msg = Ext.String.format('<span style="color:{0};">{1}</span>',color,msg);
         }

         this.getMessageBox().update({message: msg});
     },
     updateGrid: function(){

        if(this.getSelectedProjects().length == 0){
            this.updateMessageBox("No project selected select one or more projects to display the Summary");
            return;
        }

         CArABU.technicalservices.CycleTimeCalculator.startDate = this.getStartDate();
         CArABU.technicalservices.CycleTimeCalculator.endDate = this.getEndDate();
         CArABU.technicalservices.CycleTimeCalculator.precision = this.getSetting('precision');
         CArABU.technicalservices.CycleTimeCalculator.granularity = this.getSetting('granularity');

         this.getGridBox().removeAll();
         this.updateMessageBox();
         //this.setUpdateButtonUpdateable(false);
         this.setLoading('Loading Current Data...');

         this.fetchWsapiArtifactData().then({
             success: this.buildCycleGrid,
             failure: this.showErrorNotification,
             scope: this
         }).always(function(){ this.setLoading(false);}, this);
     },
     buildCycleGrid: function(records){
        this.logger.log('buildCycleGrid', records);

         if (records && records.length > 0){
             if (this.calculateCycleTime()){
                 this.setLoading('Loading Historical data...')
                 this.fetchHistoricalData(records).then({
                     //success: this.addGrid,
                     success: this.calculateSummary,
                     failure: this.showErrorNotification,
                     scope: this
                 }).always(function(){ this.setLoading(false);}, this);
             } else {
                 this.addGrid(records);
             }
         } else {
             //there's a message, the need to refine the data.
         }
     },

     calculateSummary: function(records){
        var me = this;
        this.logger.log('calculateSummary',records, records.length);

        var cycle_time_summary = {};
        var results = [];
        var cycle_states = me.getCycleStates();
        var ready_queue_end_value = me.getReqdyQueueStateValue();
        // if(ready_queue_end_value == "(No State)"){
        //     ready_queue_end_value = cycle_states[2]
        // }

        if(me.getSetting('dateType') == 'LastNWeeks'){

            console.log(me.getStartDate(),me.getEndDate());
            var totalDays = Rally.util.DateTime.getDifference(me.getEndDate(), me.getStartDate(), 'day') / 7;

            var dt = me.getStartDate();
            for(i=0; i< totalDays; i++){
                cycle_time_summary[Ext.Date.format(dt, 'd-M-y')] = {
                    "Week" : Ext.Date.format(dt, 'd-M-y'),
                    "StartDate" : dt,
                    "EndDate" : Ext.Date.add(dt,Ext.Date.DAY,7),
                    "LeadTime" : 0,
                    "ReadyQueueTime" : 0,
                    "BlockTime": 0,
                    "ReadyTime": 0,
                    "TotalArtifacts" : 0,
                    "Records": []                    
                }
                dt = Ext.Date.add(dt,Ext.Date.DAY,7);
            }

            Ext.Object.each(cycle_time_summary,function(key,value){
                Ext.Array.each(records,function(artifact){
                    if(artifact.get('AcceptedDate') && Ext.Date.between(artifact.get('AcceptedDate'), value.StartDate, value.EndDate)){
                        var ready_queue_cycle_time = CArABU.technicalservices.CycleTimeCalculator.getCycleTimeData(artifact.get('cycleTimeData').snaps,me.getStateField(),me.getReqdyQueueStateValue(),ready_queue_end_value,cycle_states);
                        cycle_time_summary[key].LeadTime += Ext.Number.from(artifact.get('cycleTimeData').cycleTime,0);
                        cycle_time_summary[key].ReadyQueueTime += Ext.Number.from(ready_queue_cycle_time.cycleTime,0);
                        cycle_time_summary[key].BlockTime += Ext.Number.from(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(artifact.get('timeInStateData'), "Blocked",null,""),0);
                        cycle_time_summary[key].ReadyTime += Ext.Number.from(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(artifact.get('timeInStateData'), "Ready",null,""),0);
                        cycle_time_summary[key].TotalArtifacts++;
                        cycle_time_summary[key].Records.push(artifact);            
                    }
                });
            });

            console.log(cycle_time_summary);

        }else{
            // Calculate the averages for each project
            Ext.Array.each(records,function(artifact){
                var ready_queue_cycle_time = CArABU.technicalservices.CycleTimeCalculator.getCycleTimeData(artifact.get('cycleTimeData').snaps,me.getStateField(),me.getReqdyQueueStateValue(),ready_queue_end_value,cycle_states);
                if(cycle_time_summary[artifact.get('Project').ObjectID]){
                    cycle_time_summary[artifact.get('Project').ObjectID].LeadTime += Ext.Number.from(artifact.get('cycleTimeData').cycleTime,0);
                    cycle_time_summary[artifact.get('Project').ObjectID].ReadyQueueTime += Ext.Number.from(ready_queue_cycle_time.cycleTime,0);
                    cycle_time_summary[artifact.get('Project').ObjectID].BlockTime += Ext.Number.from(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(artifact.get('timeInStateData'), "Blocked",null,""),0);
                    cycle_time_summary[artifact.get('Project').ObjectID].ReadyTime += Ext.Number.from(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(artifact.get('timeInStateData'), "Ready",null,""),0);
                    cycle_time_summary[artifact.get('Project').ObjectID].TotalArtifacts++;
                    cycle_time_summary[artifact.get('Project').ObjectID].Records.push(artifact);            
                } else {
                    cycle_time_summary[artifact.get('Project').ObjectID] = {
                        "Project" : artifact.get('Project').Name,
                        "LeadTime" : Ext.Number.from(artifact.get('cycleTimeData').cycleTime,0),
                        "ReadyQueueTime" : Ext.Number.from(ready_queue_cycle_time.cycleTime,0),
                        "BlockTime": Ext.Number.from(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(artifact.get('timeInStateData'), "Blocked",null,""),0),
                        "ReadyTime": Ext.Number.from(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(artifact.get('timeInStateData'), "Ready",null,""),0),
                        "TotalArtifacts" : 1,
                        "Records": [artifact]
                    }
                }
            })            
        }



//(snapshots, this.stateField, this.fromState, this.toState, this.stateValues);
        this.logger.log('cycle_time_summary>>',cycle_time_summary);
        

        Ext.Object.each(cycle_time_summary,function(key,value){
            value.AvgLeadTime = value.LeadTime / value.TotalArtifacts;
            value.AvgBlockTime = value.BlockTime / value.TotalArtifacts;
            value.AvgReadyTime = value.ReadyTime / value.TotalArtifacts;
            value.AvgReadyQueueTime = value.ReadyQueueTime / value.TotalArtifacts;
            value.AvgCycleTime = value.AvgLeadTime - value.AvgReadyQueueTime;
            value.AvgActiveCycleTime = value.AvgLeadTime - value.AvgReadyQueueTime - value.AvgBlockTime - value.AvgReadyTime;
            results.push(value);
        })

         var store = Ext.create('Rally.data.custom.Store',{
             data: results
         });

         me.overallSummaryData = {};
         if(me.getSetting('dateType') == 'LastNWeeks'){
            me.overallSummaryData.Week =  'Total';
         }else{
            me.overallSummaryData.Project =  'Total';
         }
         me.overallSummaryData.AvgLeadTime = store.average('AvgLeadTime');
         me.overallSummaryData.AvgCycleTime = store.average('AvgCycleTime');

        me.addSummaryGrid(store);
        //me.addGrid(records);

        //adding the summary data to chart as well. 
        me.results = results;
        //console.log('haiya>>',me.overallSummaryData);
        //me.addChart(results);
     },

    addChart: function(results){
        var chartType = this.getSetting('chartType');
        if(chartType == 'line'){
            results.splice(results.length-1, 1);
        }
        this.getGridBox().add({
            xtype:'rallychart',
            loadMask: false,
            chartData: this.getChartData(results),
            chartConfig: this.getChartConfig(chartType)
        });
    },

    getChartData: function(results) {
        console.log('results>>',results);
        var me = this;
        var categories = [];
        
        var lead = [];
        var cycle = [];
        var active = [];
        var ready_queue = [];
        
        // console.log('me.overallSummaryData>>', me.overallSummaryData);
        // results.push(me.overallSummaryData);

        Ext.Array.each(results, function(value){
            categories.push(me.getSetting('dateType') == 'LastNWeeks' ? value.Week:value.Project);
            lead.push(Ext.util.Format.round(value.AvgLeadTime,2));
            cycle.push(Ext.util.Format.round(value.AvgCycleTime,2));
            // active.push(Ext.util.Format.round(value.AvgActiveCycleTime,2));
            // ready_queue.push(Ext.util.Format.round(value.AvgReadyQueueTime,2));
        });
        
        
        return { 
            series: [ 
                { name: "Lead", data: lead, pointPadding: 0.3, color: 'Orange' },
                { name: "Cycle", data: cycle, pointPadding: 0.4, color: 'Green'  }
            ],
            categories: categories
        };
    },

    getChartConfig: function(type) {
        var me = this;
        return {
            chart: {
                type: type
            },
            title: {
                text: 'Cycle Time Summary'
            },
            xAxis: {
            },
            yAxis: {
                min: 0,
                title: {
                    text: me.getSetting('granularity')//'Days'
                }
            },
            plotOptions: {
                column: {
                    dataLabels: {
                        enabled: true
                    },
                    grouping: false,
                    shadow: false,
                    borderWidth: 0                    
                }
            }
        };
    },     

     addSummaryGrid: function(store){
        var me = this;
         //this.logger.log('addSummaryGrid',results, results.length);
         this.suspendLayouts();

        this.getGridBox().add({
             xtype: 'rallygrid',
             store: store,
             columnCfgs: this.getSummaryColumnCfgs(),
             showPagingToolbar: true,
             scroll: 'vertical',
             title: 'Cycle Time Summary in (' + me.getSetting('granularity') + ')',
             titleAlign: 'center', 
             bodyPadding:10,
             showRowActionsColumn:false,
            features: [{
                ftype: 'summary'
            }],
            viewConfig: {
                listeners: {
                    refresh: function(gridview) {
                        console.log(gridview);
                        console.log('is fully loaded',gridview);
                        me.results.push({"Project":"Total","AvgLeadTime":gridview.summaryFeature.summaryRecord.data.AvgLeadTime,"AvgCycleTime":gridview.summaryFeature.summaryRecord.data.AvgCycleTime});
                        me.addChart(me.results);
                    },
                    cellclick: me.showDrillDown,
                    scope:me
                }
            },            
            ptyText:  '<div class="no-data-container"><div class="secondary-message">No data was found for the selected current filters, cycle time parameters and projects selected.</div></div>'
         });
         this.resumeLayouts(true);
     },


    showDrillDown: function(view, cell, cellIndex, record) {
        var me = this;
        
        console.log(view, cell, cellIndex, record);

        var store = Ext.create('Rally.data.custom.Store', {
            data: record.get('Records'),
            pageSize: 2000
        });
        
        Ext.create('Rally.ui.dialog.Dialog', {
            id        : 'detailPopup',
            title     : 'Records for '+record.get('Project'),
            width     : Ext.getBody().getWidth() - 50,
            height    : Ext.getBody().getHeight() - 50,
            closable  : true,
            layout    : 'border',
            items     : [
            {
                xtype                : 'rallygrid',
                region               : 'center',
                layout               : 'fit',
                sortableColumns      : true,
                showRowActionsColumn : false,
                showPagingToolbar    : false,
                columnCfgs           : this.getDrillDownColumns(),
                store : store
            }]
        }).show();
    },

    getDrillDownColumns: function() {
        return [
            {
                dataIndex : 'FormattedID',
                text: "id"
            },
            {
                dataIndex : 'Name',
                text: "Name",
                flex: 1
            },
            {
                dataIndex: 'ScheduleState',
                text: 'Schedule State'
            }
        ].concat(this.getHistoricalDataColumns());;
    },

    _export: function(){
        var me = this;
        if ( !me.results ) { return; }
        
        var filename = Ext.String.format('summary_export.csv');
        me._create_csv(me.results);

        Rally.technicalservices.FileUtilities.saveCSVToFile(me.CSV,filename);
    },

    _create_csv: function(results){
        var me = this;
        if ( !results ) { return; }
        
        me.setLoading("Generating CSV");

        var CSV = "";    
        var row = "";
        // Add the column headers
        var grid_columns = me.getSummaryColumnCfgs();
        var columns = [];
        Ext.Array.each(grid_columns,function(col){
            row += col.text.replace("<BR>","") + ',';
            columns.push(col.dataIndex);
        });

        CSV += row + '\r\n';

        //Write the totals row.
        row = "";

        CSV += row + '\r\n';
        // Loop through tasks hash and create the csv 
        Ext.Array.each(me.results,function(task){
            row = "";
            Ext.Array.each(columns,function(col){
                row += task[col] ? task[col] + ',':',';
            },me)
            CSV += row + '\r\n';

            if(task.children && task.children.length > 0){
                Ext.Array.each(task.children,function(child){
                    row = "";
                    Ext.Array.each(columns,function(col){
                        row += child[col] ? child[col] + ',':',';
                    },me)
                    CSV += row + '\r\n';

                    if(child.children && child.children.length > 0){
                        Ext.Array.each(child.children,function(gchild){
                            row = "";
                            Ext.Array.each(columns,function(col){
                                if(col == "Name" || col == "WorkProduct"){
                                    row += gchild[col] ? '"' + gchild[col].replace(/"/g, '""') + '"' + ',':',';
                                }else{
                                    row += gchild[col] ? gchild[col] + ',':',';
                                }
                            },me)
                            CSV += row + '\r\n';                             
                        });
                    }
                },me);
            }
        },me);

        me.CSV = CSV;
        me.setLoading(false);
    },


     // addGrid: function(records){
     //     //this.logger.log('addGrid',records, records.length);
     //     var fields = records.length > 0 && records[0].getFields() || undefined;

     //     this.suspendLayouts();
     //     var store = Ext.create('Rally.data.custom.Store',{
     //         data: records,
     //         fields: fields,
     //         pageSize: 25 //records.length
     //     });

     //     this.getGridBox().add({
     //         xtype: 'rallygrid',
     //         store: store,
     //         columnCfgs: this.getColumnCfgs(records[0]),
     //         showPagingToolbar: true,
     //         scroll: 'vertical',
     //         emptyText:  '<div class="no-data-container"><div class="secondary-message">No data was found for the selected current filters, cycle time parameters and project scope.</div></div>'
     //     });
     //     this.resumeLayouts(true);
     // },

     fetchWsapiArtifactData: function(){
         var deferred = Ext.create('Deft.Deferred');
         Ext.create('Rally.data.wsapi.artifact.Store',{
            models: this.getModelNames(),
            limit: this.getExportLimit(),
            fetch: this.getCurrentFetchList(),
            filters: this.getWsapiArtifactFilters(),
            context: {
                projectScopeUp:false,
                projectScopeDown:false,
                project:null
            },
            pageSize: Math.min(this.getExportLimit(), 1000)
        }).load({
             callback: function(records, operation){
                 this.logger.log('fetchWsapiArtifactData', records.length, operation, records);
                 if (operation.wasSuccessful()){
                     var count =  operation && operation.resultSet && operation.resultSet.total;
                     this.logger.log('count', count, this.getExportLimit());
                     if (count > this.getExportLimit()){
                         //this.updateMessageBox(Ext.String.format('A total of {0} current records were found, but only {1} can be fetched for performance reasons.  Please refine the advanced filters (current, not Cycle Time) to fetch less data.',count,this.getExportLimit()), Rally.util.Colors.brick);
                        deferred.resolve(null);
                     } else {
                         //this.updateMessageBox(Ext.String.format('{0} current records found.', count));
                         deferred.resolve(records);
                     }

                 } else {
                     deferred.reject("Unable to get artifact count:  " + operation.error.errors.join(','));
                 }
             },
             scope: this
         });

         return deferred;
     },

    getWsapiArtifactFilters: function(){
        var filters = this._gridConfig && this._gridConfig.filters && this._gridConfig.filters.filters[0] || null;
        if (this.getQueryFilter()){
            if (filters){
                filters = filters.and(this.getQueryFilter());
            } else {
                filters = this.getQueryFilter();
            }
        }
        this.logger.log('getWsapiArtifactFilters', filters);
        if (this.calculateCycleTime() && this.getShowOnlyCompletedCycles()){  //show only data that is in a completed cycle state

            var states = this.getCycleStates(),
                cycleFilters = [],
                stateFieldName = this.getStateField(),
                toStateValue = this.getToStateValue();

            var re = new RegExp("PortfolioItem\/","i");
            if (re.test(this.getModelNames()[0]) && stateFieldName === 'State'){
                stateFieldName = "State.Name";
            }

            Ext.Array.each(states, function(s){
               // console.log('s',stateFieldName, s);
                if (s === toStateValue || cycleFilters.length > 0){
                    cycleFilters.push({
                        property: stateFieldName,
                        value: s
                    });
                }
            });
            cycleFilters = Rally.data.wsapi.Filter.or(cycleFilters);

            if (filters){
                filters = filters.and(cycleFilters);
            } else {
                filters = cycleFilters;
            }

        }

        var projectFilters = [];

        Ext.Array.each(this.getSelectedProjects(),function(p){
            projectFilters.push({
                                    property:'Project',
                                    value:p
                                });
        })

        filters.and(Rally.data.wsapi.Filter.or(projectFilters));

        var updatedFilters = filters.and(Rally.data.wsapi.Filter.or(projectFilters));

        filters = updatedFilters || [];
        this.logger.log('getWsapiArtifactFilters', filters.toString());
        return filters;
    },
     getStartDate: function(){
        if (this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.startDate){
        //if (this.startDatePicker.getValue()){
            return this._gridConfig.cycleTimeParameters.startDate;
            //return Rally.util.DateTime.toIsoString(this._gridConfig.cycleTimeParameters.startDate);
        }
        return null;
    },
    getEndDate: function(){
        if (this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.endDate){
        //if (this.endDatePicker.getValue()){
            return this._gridConfig.cycleTimeParameters.endDate;
            //return Rally.util.DateTime.toIsoString(this._gridConfig.cycleTimeParameters.endDate);
        }
        return null;
    },

    getCycleStates: function(){
        return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.cycleStates || [];
    },
    getGridColumns: function(){
        return this.down('fieldpickerbutton') && this.down('fieldpickerbutton').getFields();
        //return this._gridConfig && this._gridConfig.fields || [];
    },
    getPreviousStates: function(endState){
       var states = this.getCycleStates(),
        // var states = this.getFromStateCombo().getStore().getRange(),
            previousStates = [null];

        for (var i=0; i<states.length; i++){
            var state = states[i];
            if (state === endState){
                i = states.length;
            } else {
                if (state && state.length > 0){
                    previousStates.push(state);
                }
            }
        }
        this.logger.log('getPreviousStates', previousStates);
        return previousStates;
    },
    getEndStates: function(endState){
        if (!endState){
            endState = this.getToStateValue();
        }

        var states = this.getCycleStates(),
            endStates = [];
        this.logger.log('getEndStates', endState, states);

        for (var i=states.length-1; i>0; i--){
            var state = states[i];
            endStates.push(state);
            if (state === endState){
                i = 0;
            }
        }
        return endStates;
    },
    getCurrentFetchList: function(){
        var fetch = ['ObjectID','Project','Blocked','Ready','Name','FormattedID','ScheduleState','AcceptedDate'];

        // var fetch = Ext.Array.merge(this.getGridColumns(), ['ObjectID']);
        if (this.getStateField()){
            Ext.Array.merge(this.getStateField(), fetch);
        }
        // if (this.getIncludeBlocked()){
        //     Ext.Array.merge('Blocked', fetch);
        // }
        // if (this.getIncludeReady()){
        //     Ext.Array.merge(fetch, 'Ready');
        // }
        // this.logger.log('getCurrentFetchList', fetch);
        return fetch;
    },
    getShowOnlyCompletedCycles: function(){
        return true;
    },
    getWsapiArtifactCount: function(config){
        config.limit = 1;
        config.fetch = ['ObjectID'];
        config.pageSize = 1;
        var deferred = Ext.create('Deft.Deferred');
        Ext.create('Rally.data.wsapi.artifact.Store',config).load({
            callback: function(records, operation){
                this.logger.log('getWsapiArtifactCount', operation);
                if (operation.wasSuccessful()){
                    var count = operation && operation.resultSet && operation.resultSet.total;
                    deferred.resolve(count);
                } else {
                    deferred.reject("Unable to get aritfact count:  " + operation.error.errors.join(','));
                }
            },
            scope: this
        });

        return deferred;
    },

    getExportLimit: function(){
        return this.getSetting('exportLimit') || 1000;
    },
    getStateValueArray: function(){
        var arr = _.map(this.getFromStateCombo().getStore().getRange(), function(r){
            return r.get('value');
        }, this);
        Ext.Array.remove(arr, "");
        return arr;
    },
     fetchHistoricalData: function(records){
        var deferred = Ext.create('Deft.Deferred');
        this.logger.log('fetchHistoricalData', records);

        if (this.calculateCycleTime() && records.length > 0) {
            this.setLoading(Ext.String.format("Loading historical data for {0} artifacts.", records.length));

            var includeBlocked = this.getIncludeBlocked(),
                includeReady = this.getIncludeReady(),
                fromState = this.getFromStateValue(),
                toState = this.getToStateValue(),
                stateField = this.getStateField(),
                stateValues = this.getCycleStates(),
                readyQueueState = this.getReqdyQueueStateValue();

            this.logger.log('stateValues', stateValues);
            Ext.create('CArABU.technicalservices.CycleTimeDataStore', {
                stateField: stateField,
                stateValues: stateValues,
                includeReady: includeReady,
                includeBlocked: includeBlocked,
                fromState: fromState,
                toState: toState,
                startDate: this.getStartDate(),
                endDate: this.getEndDate(),
                projects: this.getSelectedProjectOids(),
                readyQueueState: readyQueueState
            }).load(records).then({
                success: function (updatedRecords) {

                    //this.updateMessageBox(Ext.String.format("Displaying {0} of {1} records with relevant cycle time data.", updatedRecords.length, records.length));

                    deferred.resolve(updatedRecords);
                },
                failure: function (msg) {
                    deferred.reject(msg);
                },
                scope: this
            }).always(function () {
                this.setLoading(false);
            }, this);
        }else {
            deferred.resolve(records);
        }

        return deferred;
    },
    updateHistoricalData: function(updatedRecords){
        this.logger.log('updateHistoricalData', updatedRecords);
    },
    getCycleTimeColumnHeader: function(){
        return Ext.String.format("Cycle time from {0} to {1} ({2}s)", this.getFromStateValue(), this.getToStateValue(), CArABU.technicalservices.CycleTimeCalculator.granularity);
    },
    getCycleTimeStartColumnHeader: function(){
        return "Cycle Time Start Date";
    },
    getCycleTimeEndColumnHeader: function(){
        return "Cycle Time End Date";
    },
    getTimeInStateColumnHeader: function(stateName){
        return Ext.String.format("Time in {0} ({1}s)", stateName || "[No State]", CArABU.technicalservices.CycleTimeCalculator.granularity);
    },
    
    getHistoricalDataColumns: function(){


        var columns = [],
            toState = this.getToStateValue(),
            fromState = this.getFromStateValue();

        if (fromState && toState){
            columns.push({
                xtype: 'cycletimetemplatecolumn',
                text: this.getCycleTimeColumnHeader(),
                flex: 1
            });
        }


        if (this.getIncludeBlocked()){
            columns.push({
                xtype: 'timetemplatecolumn',
                dataType: 'timeInStateData',
                stateName: "Blocked",
                text: this.getTimeInStateColumnHeader("Blocked"),
                flex: 1
            });
        }
        if (this.getIncludeReady()){
            columns.push({
                xtype: 'timetemplatecolumn',
                dataType: 'timeInStateData',
                stateName: 'Ready',
                text: this.getTimeInStateColumnHeader("Ready"),
                flex: 1
            });
        }


        if (fromState && toState){
            Ext.Array.each( this.getCycleStates(), function(s){

                if (s && s.length > 0){
                    var header = this.getTimeInStateColumnHeader(s);
                    //if (s === CArABU.technicalservices.CycleTimeCalculator.creationDateText){
                    //    header =  this.getTimeInStateColumnHeader(CArABU.technicalservices.CycleTimeCalculator.noStateText);
                    //}
                    columns.push({
                        xtype: 'timetemplatecolumn',
                        dataType: 'timeInStateData',
                        stateName: this.getStateField(),
                        stateValue: s,
                        text: header,
                        flex: 1
                    });
                    if (s === toState){ return false; }
                }

            }, this);
        }
        this.logger.log('getHistoricalDataColumns', columns);
        return columns;
    },
    getColumnCfgs: function(model){
        var columns = [];

        Ext.Array.each(this.getCurrentFetchList(), function(c){
            if (c !== 'ObjectID'){
                if (model){
                    var field = model.getField(c),
                        tpl = Rally.ui.renderer.RendererFactory.getRenderTemplate(field),
                        col = {
                            text: field.displayName,
                            dataIndex: c,
                            //renderer: tpl
                            renderer: function(v,m,r){
                                 return tpl.apply(r.getData());
                            }
                        };
                } else {
                    var col = {
                        text: c.replace("c_",""),
                        dataIndex: c
                    };
                }
                if (c === 'Name'){
                    col.flex = 1;
                }
                columns.push(col);
            }
        });


        if (this.calculateCycleTime()){
            columns = columns.concat(this.getHistoricalDataColumns());
        }
        this.logger.log('getColumnCfgs', columns);
        return columns;
    },

    getSummaryColumnCfgs: function(){
        var me = this;
        me.overallSummaryData = {"Project":"Total"};
        var columns = [{
            dataIndex: me.getSetting('dateType') == 'LastNWeeks' ? 'Week' : 'Project',
            text: me.getSetting('dateType') == 'LastNWeeks' ? 'Week' : 'Project',
            summaryRenderer: function() {
                return "Total"; 
            },
            flex:1
        },
        {
            dataIndex: 'AvgLeadTime',
            text:'Avg. Lead Time',
            summaryType: 'average',
            renderer: function(value){
                return Ext.Number.toFixed(value,2); 
            },
            exportRenderer: function(value){
                return value; 
            },            
            summaryRenderer: function(value, summaryData, dataIndex) {
                me.overallSummaryData.AvgLeadTime = value;
                return Ext.Number.toFixed(value,2); 
            }
        },
        {
            dataIndex: 'AvgReadyQueueTime',
            text:'Avg. Ready Queue Time',
            summaryType: 'average',
            renderer: function(value){
                return Ext.Number.toFixed(value,2); 
            },
            exportRenderer: function(value){
                return value; 
            },
            summaryRenderer: function(value, summaryData, dataIndex) {
                return Ext.Number.toFixed(value,2); 
            }
        },
        {
            dataIndex: 'AvgCycleTime',
            text:'Avg. Cycle Time',
            summaryType: 'average',
            renderer: function(value){
                return Ext.Number.toFixed(value,2); 
            },
            exportRenderer: function(value){
                return value; 
            },
            summaryRenderer: function(value, summaryData, dataIndex) {
                me.overallSummaryData.AvgCycleTime = value;                
                return Ext.Number.toFixed(value,2); 
            }
        },
        {
            dataIndex: 'AvgActiveCycleTime',
            text:'Avg. Active Cycle Time',
            summaryType: 'average',
            renderer: function(value){
                return Ext.Number.toFixed(value,2); 
            },
            exportRenderer: function(value){
                return value; 
            },
            summaryRenderer: function(value, summaryData, dataIndex) {
                return Ext.Number.toFixed(value,2); 
            }
        },
        {
            dataIndex: 'AvgBlockTime',
            text:'Avg. Block Time',
            summaryType: 'average',
            renderer: function(value){
                return Ext.Number.toFixed(value,2); 
            },
            exportRenderer: function(value){
                return value; 
            },
            summaryRenderer: function(value, summaryData, dataIndex) {
                return Ext.Number.toFixed(value,2); 
            }
        },
        {
            dataIndex: 'AvgReadyTime',
            text:'Avg. Ready to Pull Time',
            summaryType: 'average',
            renderer: function(value){
                return Ext.Number.toFixed(value,2); 
            },
            exportRenderer: function(value){
                return value; 
            },
            summaryRenderer: function(value, summaryData, dataIndex) {
                return Ext.Number.toFixed(value,2); 
            }
        }

        ];


        return columns;
    },


    // _export: function(){
    //     var grid = this.down('rallygrid');
    //     var me = this;

    //     if ( !grid ) { return; }
        
    //     this.logger.log('_export',grid);

    //     var filename = Ext.String.format('export.csv');

    //     this.setLoading("Generating CSV");
    //     Deft.Chain.sequence([
    //         function() { return Rally.technicalservices.FileUtilities._getCSVFromCustomBackedGrid(grid) } 
    //     ]).then({
    //         scope: this,
    //         success: function(csv){
    //             if (csv && csv.length > 0){
    //                 Rally.technicalservices.FileUtilities.saveCSVToFile(csv,filename);
    //             } else {
    //                 Rally.ui.notify.Notifier.showWarning({message: 'No data to export'});
    //             }
                
    //         }
    //     }).always(function() { me.setLoading(false); });
    // },


    exportData: function(includeTimestamps, includeSummary){
        var grid = this.down('rallygrid');
        if (!grid){
            this.showErrorNotification("Cannot save export becuase there is no data displapyed to export.");
            return;
        }
        var totalCount= grid.getStore().getTotalCount();
        this.logger.log('exportData', totalCount);

        var store = grid.getStore();

        this.getMessageBox().setLoading("Preparing Export File(s)...");
        store.load({
            pageSize: totalCount,
            limit: totalCount,
            callback: function(records, operation){
                this.getMessageBox().setLoading(false);
                if (operation.wasSuccessful()){
                    var columns = this.getColumnCfgs(records && records[0]);
                    this.saveExportFiles(records, columns, includeTimestamps, includeSummary);
                } else {
                    this.logger.log('Error preparing export data', operation);
                    Rally.ui.notify.Notifier.showError('Error preparing export data:  ' + operation && operation.error && operation.error.errors.join(','));
                }

            },
            scope: this
        });
    },
    saveExportFiles: function(updatedRecords, columns, includeTimestamps, includeSummary){

        if (includeSummary){
            var filename = Ext.String.format("cycle-time-{0}.csv", Rally.util.DateTime.format(new Date(), 'Y-m-d-h-i-s')),
                csv = this.getExportSummaryCSV(updatedRecords, columns);
           // this.logger.log('saveExportFiles', csv, filename);
            CArABU.technicalservices.Exporter.saveCSVToFile(csv, filename);
        }
        if (includeTimestamps){
            var filename = Ext.String.format("time-in-state-{0}.csv", Rally.util.DateTime.format(new Date(), 'Y-m-d-h-i-s')),
                timeStampCSV = this.getExportTimestampCSV(updatedRecords);
           // this.logger.log('saveExportFiles', timeStampCSV);
            CArABU.technicalservices.Exporter.saveCSVToFile(timeStampCSV, filename);
        }
    },
    getExportTimestampCSV: function(updatedRecords){
        return CArABU.technicalservices.CycleTimeCalculator.getExportTimestampCSV(updatedRecords, this.exportDateFormat);
    },
    getExportSummaryCSV: function(updatedRecords, columns){
        var standardColumns = _.filter(columns, function(c){ return c.dataIndex || null; }),
            headers = _.map(standardColumns, function(c){ if (c.text === "ID") {return "Formatted ID"; } return c.text; }),
            fetchList = _.map(standardColumns, function(c){ return c.dataIndex; });

        this.logger.log('getExportSummaryCSV', headers, fetchList);
        var states = this.getCycleStates(),
            stateField = this.getStateField(),
            includeBlocked = this.getIncludeBlocked(),
            includeReady = this.getIncludeReady();

        headers.push(this.getCycleTimeColumnHeader());
        headers.push(this.getCycleTimeStartColumnHeader());
        headers.push(this.getCycleTimeEndColumnHeader());

        if (includeBlocked){
            headers.push(this.getTimeInStateColumnHeader("Blocked"));
        }
        if (includeReady){
            headers.push(this.getTimeInStateColumnHeader("Ready"));
        }

        Ext.Array.each(states, function(state){
            //if (state === CArABU.technicalservices.CycleTimeCalculator.creationDateText){
            //    headers.push(this.getTimeInStateColumnHeader(CArABU.technicalservices.CycleTimeCalculator.noStateText));
            //} else {
                headers.push(this.getTimeInStateColumnHeader(state));
            //}

        }, this);

        var csv = [headers.join(',')],
            dateFormat = this.exportDateFormat;

        for (var i = 0; i < updatedRecords.length; i++){
            var row = [],
                record = updatedRecords[i];

            for (var j = 0; j < fetchList.length; j++){
                var val = record.get(fetchList[j]);
                if (Ext.isObject(val)){
                    if (val._tagsNameArray){
                        var newVal = [];
                        Ext.Array.each(val._tagsNameArray, function(t){
                            newVal.push(t.Name);
                        });
                        val = newVal.join(',');
                    } else {
                        val = val._refObjectName;
                    }
                }
                row.push(val || "");
            }
            //CycleTime
            var timeInStateData = record.get('timeInStateData');

            row.push(record.get('cycleTimeData') && record.get('cycleTimeData').cycleTime || "");

            var startDate = record.get('cycleTimeData') && record.get('cycleTimeData').startDate || null,
                endDate = record.get('cycleTimeData') && record.get('cycleTimeData').endDate || null;

            var formattedStart = startDate && Rally.util.DateTime.format(startDate,dateFormat) || "",
                formattedEnd = endDate && Rally.util.DateTime.format(endDate,dateFormat) || "";

            row.push(formattedStart);
            row.push(formattedEnd);

            if (includeBlocked){
                row.push(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(timeInStateData, "Blocked",null,""));
            }
            if (includeReady){
                row.push(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(timeInStateData, "Ready",null, ""));
            }

            for (var s = 0; s < states.length; s++){
                if (timeInStateData){
                    row.push(CArABU.technicalservices.CycleTimeCalculator.getRenderedTimeInStateValue(timeInStateData[stateField], states[s], record.get(states[s]), ""));
                } else {
                    row.push("");
                }
            }

            row = _.map(row, function(v){ return Ext.String.format("\"{0}\"", v.toString().replace(/"/g, "\"\""));});
            csv.push(row.join(","));
        }
        return csv.join("\r\n");
    },
    getQueryFilter: function(){
        var filter = this.getSetting('queryFilter');
        if (filter && filter.length > 0){
            return Rally.data.wsapi.Filter.fromQueryString(filter);
        }
        return null;
    },
    getIncludeBlocked: function(){
       return true;
       //return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.showBlocked || false;
       // return this.includeBlocked.pressed;

    },
    getIncludeReady: function(){
        return true;
       //return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.showReady || false;
       // return this.includeReady.pressed;
    },
    getFromStateCombo: function(){
        return this.cycleTimeFromState;
        //return this.down('#cb-fromState');
    },
    getToStateCombo: function(){
        return this.cycleTimeToState;
        //return this.down('#cb-toState');
    },
    getToStateValue: function(){
        return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.cycleEndState || null;
    },
    getFromStateValue: function(){
        return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.cycleStartState || null;
    },

    getSelectedProjects: function(){
        return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.projects || null;
    },

    getSelectedProjectOids: function(){
        var projects_refs =  [];
        Ext.Array.each(this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.projects, function(project){
            projects_refs.push(Rally.util.Ref.getOidFromRef(project));
        });
        return projects_refs;
    },

    getLastNMonths: function(){
        return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.lastNMonths || null;
    },

    getReqdyQueueStateValue: function(){
        return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.cycleReadyQueueState || null;
    },
    getStateField: function(){
        return this._gridConfig && this._gridConfig.cycleTimeParameters && this._gridConfig.cycleTimeParameters.cycleStateField || null;
        //return this.cycleTimeField;
    },
    getModelNames: function(){
        var modelNames = this.getSetting('artifactType'); //includeTypes');

        //if (Ext.isString(modelNames)){
        //    modelNames = modelNames.split(',');
        //    return modelNames;
        //}

        if(modelNames == "Feature"){
            return ['PortfolioItem/Feature'];
        }else{
            return ['HierarchicalRequirement','Defect'];
        }

        this.logger.log('getModelNames', modelNames);
    },
    getSelectorBox: function(){
        return this.down('#selector_box');
    },
    getGridBox: function(){
        return this.down('#grid_box');
    },
    getSettingsFields: function(){
        return CArABU.technicalservices.CycleTimeData.Settings.getFields(this.getSettings());
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.addSelectors();
    }
});
