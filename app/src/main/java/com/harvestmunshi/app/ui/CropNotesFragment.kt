package com.harvestmunshi.app.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.harvestmunshi.app.R
import com.harvestmunshi.app.data.CropDataManager
import com.harvestmunshi.app.model.Crop

class CropNotesFragment : Fragment() {
    private var potId: Int? = null
    private var crop: Crop? = null
    private lateinit var notesLayout: LinearLayout
    private lateinit var addNoteEditText: EditText
    private lateinit var addNoteButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        potId = arguments?.getInt(ARG_POT_ID)
        crop = CropDataManager.loadCrops(requireContext()).find { it.potId == potId }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_crop_notes, container, false)
        notesLayout = view.findViewById(R.id.notesLayout)
        addNoteEditText = view.findViewById(R.id.addNoteEditText)
        addNoteButton = view.findViewById(R.id.addNoteButton)
        updateNotes()
        addNoteButton.setOnClickListener {
            val note = addNoteEditText.text.toString().trim()
            if (note.isNotEmpty() && crop != null) {
                crop!!.notes.add(0, note)
                CropDataManager.saveCrops(requireContext(), CropDataManager.loadCrops(requireContext()).map {
                    if (it.potId == crop!!.potId) crop!! else it
                }.toMutableList())
                addNoteEditText.text.clear()
                updateNotes()
            }
        }
        return view
    }

    private fun updateNotes() {
        notesLayout.removeAllViews()
        crop?.notes?.forEach { note ->
            val noteView = TextView(requireContext())
            noteView.text = note
            noteView.setTextColor(resources.getColor(R.color.text_primary, null))
            noteView.textSize = 16f
            noteView.setPadding(0, 8, 0, 8)
            notesLayout.addView(noteView)
        }
    }

    companion object {
        private const val ARG_POT_ID = "pot_id"
        fun newInstance(potId: Int): CropNotesFragment {
            val fragment = CropNotesFragment()
            val args = Bundle()
            args.putInt(ARG_POT_ID, potId)
            fragment.arguments = args
            return fragment
        }
    }
} 