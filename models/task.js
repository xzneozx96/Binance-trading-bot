const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    // general info
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String, // WR - PM - WO
      required: true,
    },
    category: {
      type: String, // planned (PM) - unplanned (WR, manually created Tasks)
      required: true,
      default: "unplanned",
    },
    description: {
      type: String,
    },
    maintenanceReason: {
      type: String,
      default: "",
    },
    maintenanceSolution: {
      type: String,
      default: "",
    },
    facility: {
      type: mongoose.Types.ObjectId,
      ref: "facility",
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
    priority: {
      type: String, // low - high - medium
      required: true,
      default: "high",
    },
    instructions: {
      type: Array,
      default: [],
    },

    // thông tin về timer - stopwatch
    timerHours: {
      type: Number,
      default: 0,
    },
    timerMins: {
      type: Number,
      default: 0,
    },
    timerSeconds: {
      type: Number,
      default: 0,
    },

    // thông tin người tạo task
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // tài liệu đính kèm
    attachments: {
      type: Array,
      default: [],
    },
    status: {
      type: String, // open - doing - done
      required: true,
      default: "open",
    },

    // thời gian ngừng máy, tính bằng giây
    downtime: {
      type: Number, // unit: seconds
      default: 0,
    },

    // thời gian bỏ ra để thực hiện nhiệm vụ, tính bằng giây
    timeSpent: {
      type: Number, // unit: hours
      default: 0,
    },

    // date info
    startDate: {
      type: Date,
      required: true,
      default: new Date(),
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completeDate: {
      type: Date,
      default: null,
    },

    // info for WR only
    requestorName: {
      type: String,
      default: "",
    },
    requestorEmail: {
      type: String,
      default: "",
    },
    requestLocation: {
      type: String,
      default: "",
    },

    // info for PM only
    recurrenceType: {
      type: String, // daily - weekly - monthly - yearly - threshold
      default: null,
    },
    recurrenceUnit: {
      type: Number, // repeat every 1,2,3... day - week - month - year
      default: null,
    },
    recurrenceStartTime: {
      type: String, // task triggered at 9:00 AM, 9:30AM, 10:00 AM... (30 mins apart between selections)
      default: null,
    },
    recurrenceWeekday: {
      type: String, // only exists for weekly type, task triggered on Monday, Tuesday..
      default: null,
    },
    recurrenceOrdinalNumber: {
      type: String, // only exists for monthly & yearly type, task triggered on 1st, 2nd, 3rd day of month or day in month of the year...
      default: null,
    },
    recurrenceMonth: {
      type: String, // only exists for yearly type, task triggered on Jan, Feb, March...
      default: null,
    },
    recurrenceMeter: {
      type: mongoose.Types.ObjectId, // only exists for threshold type - sensors
      default: null,
      ref: "Meter",
    },
    recurrenceThresholdValue: {
      type: Number, // only exists for threshold type - when meter exceeds this value, the task is triggered
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("task", TaskSchema);
