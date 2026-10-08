import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

function isValidVehicleNumber(value: unknown) {
  return (
    typeof value === "string" &&
    /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4}$/.test(value)
  )
}

function isValidText(value: unknown, required = false) {
  return (
    typeof value === "string" &&
    (required ? value.trim().length > 0 : value.length <= 500)
  )
}

function serialize(doc: any) {
  return {
    id: doc._id.toString(),
    number: doc.vehicle_number,
    type: doc.vehicle_type,
    owner: doc.owner_name,
    department: doc.department ?? undefined,
    company: doc.company_name ?? undefined,
    purpose: doc.purpose ?? undefined,
    remark: doc.remark ?? undefined,
    visitorName: doc.visitor_name ?? undefined,

    inTime: new Date(doc.in_time).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),

    outTime: doc.out_time
      ? new Date(doc.out_time).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      : undefined,

    savedDate: new Date(doc.saved_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }
}

// GET - Get all vehicle records
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("smart_gate")

    const records = await db
      .collection("vehicle_records")
      .find({})
      .sort({ saved_at: -1 })
      .toArray()

    return NextResponse.json(records.map(serialize))
  } catch (error) {
    console.error("MongoDB GET Error:", error)

    return NextResponse.json(
      { error: "Unable to fetch vehicle records." },
      { status: 500 }
    )
  }
}

// POST - Vehicle Entry
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const number =
      typeof body.number === "string"
        ? body.number.trim().toUpperCase()
        : ""

    const type =
      typeof body.type === "string"
        ? body.type.trim()
        : ""

    const owner =
      typeof body.owner === "string"
        ? body.owner.trim()
        : ""

    const company =
      typeof body.company === "string"
        ? body.company.trim()
        : ""

    if (
      !isValidVehicleNumber(number) ||
      !["Car", "Bike", "Bus", "Lorry"].includes(type) ||
      !isValidText(owner, true) ||
      (body.visitorName && !isValidText(company, true))
    ) {
      return NextResponse.json(
        { error: "Invalid vehicle record. Check the required fields." },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("smart_gate")

    const now = new Date()

    const record = {
      vehicle_number: number,
      vehicle_type: type,
      owner_name: owner,
      department: body.department || null,
      company_name: company || null,
      purpose:
        typeof body.purpose === "string"
          ? body.purpose.trim().slice(0, 500)
          : null,
      remark:
        typeof body.remark === "string"
          ? body.remark.trim().slice(0, 500)
          : null,
      visitor_name: body.visitorName ? owner : null,
      in_time: now,
      out_time: null,
      saved_at: now,
    }

    const result = await db
      .collection("vehicle_records")
      .insertOne(record)

    const savedRecord = {
      ...record,
      _id: result.insertedId,
    }

    return NextResponse.json(serialize(savedRecord), {
      status: 201,
    })
  } catch (error) {
    console.error("MongoDB POST Error:", error)

    return NextResponse.json(
      { error: "Unable to save vehicle record." },
      { status: 500 }
    )
  }
}

// PATCH - Vehicle Exit
export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const id = String(body.id || "")

    if (!id) {
      return NextResponse.json(
        { error: "Invalid record id." },
        { status: 400 }
      )
    }

    const { ObjectId } = await import("mongodb")

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid record id." },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("smart_gate")

    const result = await db
      .collection("vehicle_records")
      .findOneAndUpdate(
        {
          _id: new ObjectId(id),
          out_time: null,
        },
        {
          $set: {
            out_time: new Date(),
            remark:
              typeof body.remark === "string"
                ? body.remark.trim().slice(0, 500)
                : null,
          },
        },
        {
          returnDocument: "after",
        }
      )

    if (!result) {
      return NextResponse.json(
        { error: "Vehicle was already exited or not found." },
        { status: 409 }
      )
    }

    return NextResponse.json(serialize(result))
  } catch (error) {
    console.error("MongoDB PATCH Error:", error)

    return NextResponse.json(
      { error: "Unable to update vehicle record." },
      { status: 500 }
    )
  }
}