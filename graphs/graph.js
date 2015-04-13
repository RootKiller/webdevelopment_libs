/**
 * @brief HTML5 Graph class
 */
function Graph(params)
{
	if(params.element == []._) {
		console.log("params.element must be present!");
		return false;
	}

	this.REDRAW_INTERVAL_WHEN_ACTIVE = 60/1000;

	this.element = params.element;
	this.data = (params.data) ? params.data : [];

	// Grab drawing context
	this.draw_context = this.element.getContext("2d");

	// Grab graph render target size
	this.width = parseInt(this.element.width);
	this.height = parseInt(this.element.height);

	this.element_x = parseInt(this.element.offsetLeft);
	this.element_y = parseInt(this.element.offsetTop);

	this.unit_based_x = 0; //params.x-1;
	this.unit_based_y = 0; //params.y;

	this.advance = 18;

	this.pixel_size_h = 0;// (this.width - (this.advance*2)) / this.unit_based_x;
	this.pixel_size_v = 0;//(this.height - (this.advance*2)) / this.unit_based_y;

	this.line_width = this.pixel_size_v;
	if(this.line_width < this.pixel_size_h)
	{
		this.line_width = this.pixel_size_h;
	}
	if(params.line_width)
		this.line_width = params.line_width;

	this.max_value = 1;
	this.min_value = 0;

	this.background_color = params.background_color ? params.background_color : "#FFFFFF";
	this.path_color = params.path_color ? params.path_color : "#FF0000";
	this.pointer_color = params.pointer_color ? params.pointer_color : "#FFFFFF";

	this.label_color = params.label_color ? params.label_color : "#FFFFFF";
	this.value_color = params.value_color ? params.value_color : "#FFFFFF";

	this.value_font = params.value_font ? params.value_font : "10pt Tahoma";
	this.label_font = params.label_font ? params.label_font : "8pt Tahoma";

	this.title = params.title ? params.title : "";
	this.title_color = params.title_color ? params.title_color : "#FFFFFF";
	this.title_font = params.title_font ? params.title_font : "10pt Tahoma";
	this.title_background = params.title_background ? params.title_background : "#CACACA";
	this.title_size = params.title_size ? params.title_size : 0.1;

	this.redraw_interval = null;
	this.mouse_over = false;
	this.mouse_position = {x:0,y:0};

	// Mouse handling events.
	var SELF = this;
	this.element.onmouseenter = function() 
	{		
		if(SELF.redraw_interval) clearInterval(SELF.redraw_interval);
		SELF.redraw_interval = setInterval(function()
		{
			SELF.redraw();
		}, SELF.REDRAW_INTERVAL_WHEN_ACTIVE);
		SELF.mouse_over = true;
	}

	this.element.onmouseleave = function()
	{
		if(SELF.redraw_interval) {
			clearInterval(SELF.redraw_interval);
			SELF.redraw_interval = null;
		}
		SELF.mouse_over = false;		
		SELF.draw();
	}

	this.element.onmousemove = function(e)
	{
		SELF.mouse_position = {x:e.clientX-SELF.element_x,y:e.clientY-SELF.element_y};
	}

	/**
	 * @brief Function to set graph data
	 *
	 * @param data
	 * @return @c true if data is valid @c false otherwise
	 */
	this.set_data = function(data_)
	{
		if(data_.length > 0) {
			this.data = data_;
			this.rebuild_data();
			this.redraw();
			return true;
		}
		return false;
	}

	/**
	 * @brief Draws the graph onto the canvas
	 */
	this.draw = function() {
		this.draw_context.fillStyle=this.background_color;
		this.draw_context.fillRect(0, 0, this.width, this.height);
		
		var last_point = {x:0,y:0}
		
		for(var x = 0; x < this.data.length; ++x) {
			var data = this.data[x];
			var point = {x:x,y:this.max_value - data.value};

			if(x>0) {
				this.draw_context.beginPath();
			
				this.draw_context.moveTo(this.advance+last_point.x*this.pixel_size_h, this.advance+last_point.y*this.pixel_size_v);
				this.draw_context.lineTo(this.advance+point.x*this.pixel_size_h, this.advance+point.y*this.pixel_size_v);

				this.draw_context.lineWidth = this.line_width;
				this.draw_context.strokeStyle = this.path_color;
				this.draw_context.stroke();
			}
			last_point = point;
		}

		if(this.mouse_over) {
			var current_element_x = parseInt((this.mouse_position.x-this.advance) / this.pixel_size_h % this.data.length);
			var element_data = this.data[current_element_x];

			var x = this.advance + (current_element_x * this.pixel_size_h);
			var y = this.advance + ((this.max_value - element_data.value) * this.pixel_size_v);

			this.draw_context.fillStyle = "red";
			this.draw_context.beginPath();
			this.draw_context.fillStyle = this.pointer_color;
			this.draw_context.arc(x,y,5,0,2*Math.PI,false);
			this.draw_context.fill();
	
			this.draw_context.font = this.label_font;
			this.draw_context.fillStyle = this.label_color;
			this.draw_context.textAlign="center";

			var render_above = (y+27+parseInt(this.label_font) > this.height) || (y+15+parseInt(this.value_font) > this.height);

			// Correction code (word wrapping)
			var correction = 0;
			var half_label_width = (this.draw_context.measureText(element_data.label).width/2);
			var difference = x - half_label_width;
			if(difference < 0)
				correction = -difference;
			difference = (x + half_label_width);
			if(difference > this.width)			
				correction = this.width - difference;

			var y_correction = render_above ? -27 : 27;
			
			this.draw_context.fillText(element_data.label, x + correction, y + y_correction);

			this.draw_context.font = this.value_font;
			this.draw_context.fillStyle = this.value_color;
			this.draw_context.textAlign = "center";

			// Correction code (word wrapping)
			correction = 0;
			half_label_width = (this.draw_context.measureText(element_data.value).width/2);
			difference = x - half_label_width;
			if(difference < 0)
				correction = -difference;
			difference = (x + half_label_width);
			if(difference > this.width)			
				correction = this.width - difference;

		 	y_correction = render_above ? -15 : 15;

			this.draw_context.fillText(element_data.value, x + correction, y + y_correction);
		}

		if(this.title.length > 0)
		{
			this.draw_context.fillStyle = this.title_background;
			this.draw_context.fillRect(0, this.height * (1.0-this.title_size), this.width, this.height * this.title_size);
			this.draw_context.font = this.title_font;
			this.draw_context.textAlign="center";
			this.draw_context.fillStyle = this.title_color;
			this.draw_context.fillText(this.title, this.width/2, (this.height*(1.0-this.title_size))+ (this.height*(this.title_size / 2)) + parseInt(this.title_font)/2);
		}
	}

	/**
	 * @brief This function redraws the graph. If you want to force redraw use this method instead of simply calling draw.
	 */
	this.redraw = function() {
		this.draw();
	}


	/**
	 * @brief This function rebuilds the data. Should be used right after putting new data into graph. If it wont be called graph will be wrongly drawn. (Called automatically if you use set_data function)	 
	 */
	this.rebuild_data = function()
	{
		this.max_value = this.data[0].value;
		this.min_value = this.max_value;
		for(var i = 0; i < this.data.length; ++i) 
		{
			if(this.max_value < this.data[i].value)
			{
				this.max_value = this.data[i].value;
				continue;
			}
			if(this.min_value > this.data[i].value)
			{
				this.min_value = this.data[i].value;
				continue;
			}
		}

		this.unit_based_x = this.data.length-1;
		this.unit_based_y =	this.max_value;

		this.pixel_size_h = (this.width - (this.advance*2)) / this.unit_based_x;
		this.pixel_size_v = (this.height - (this.advance*2) - (this.height * 0.15)) / this.unit_based_y;
	}


	// Initial draw
	this.rebuild_data();
	this.draw();		
}