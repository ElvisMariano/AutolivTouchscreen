# L2L API Endpoints

This document serves as a reference for the L2L API endpoints used in the Autoliv Touch Screen project.

## Dispatches

### Get Event Data

**Endpoint:** `/api/1.0/dispatches/get_event_data/`
**Method:** `GET`
**Functionality:** Provides a way to retrieve dispatch data.

**Important:** When synchronizing dispatch data, you must keep the parameters in your calls the same, otherwise the dispatch data will be incorrect.

#### Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `auth` | String | Yes | API Key authentication. |
| `site` | Integer | Yes | The site to get dispatches for. |
| `lastupdated` | DateTime | Yes* | Timestamp in UTC to limit search (Required if not passing `dispatch_id` or `dispatch_number`). Format: `%Y-%m-%d %H:%M:%S`. |
| `limit` | Integer | No | Max number of results (Default: 1000). |
| `dispatch_id` | Integer | No | Returns a single dispatch that has the given id. |
| `dispatch_number` | Integer | No | Returns a single dispatch that has the given number. |
| `line_ids` | String | No | Comma separated list of line IDs. |
| `areacode` | String | No | Limit search to machines in given area. |
| `dispatchtype_ids` | String | No | Comma separated list of dispatch type IDs. |

#### Response

Returns a JSON object with:
- `success`: Boolean
- `data`: List of dispatch records
- `max_lastupdated`: Max lastupdated value in the data list

**Example Data Object:**
```json
{
  "id": 12345,
  "dispatchnumber": 1001,
  "linecode": "LINE-01",
  "machinecode": "MACH-01",
  "description": "Problem description",
  "downtime": 120,
  "open": "T",
  "created": "2023-10-27 10:00:00",
  "technicians": [...],
  "actioncomponents": [...]
}

### Data Export (Async)

**Endpoint:** `/api/1.0/dispatches/data_export/`
**Method:** `GET`
**Functionality:** Should be used to export large datasets. Returns a `jobid`.

**Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `site` | Integer | Site ID. |
| `lastupdated_since` | DateTime | Filter modification date. |

**Status Check:**
**Endpoint:** `/api/1.0/sites/asyncjob_status/`
**Method:** `GET`
**Param:** `jobid`

> [!WARNING]
> Requires access to `/sites/` record area. Access to `/dispatches/` alone is insufficient for the status check.
